import Vendor from "../models/Vendor.model.js";
import Order from '../models/Order.model.js'
import mongoose from "mongoose";
import Product from "../models/Product.model.js";

export class VendorController {
    static async vendorLogin(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ message: "Username and password are required" });
            }
            const vendor = await Vendor.findOne({ username });

            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }

            if (vendor.password !== password) {
                return res.status(401).json({ message: "Invalid password" });
            }

            const token = vendor.createAccessToken();

            const { password: pass, __v, createdAt, referenceWebsite: refWeb, updatedAt, ...vendorData } = vendor.toObject();

            vendorData.password = undefined;
            vendorData.token = token;

            res.json({ message: "Login successful", vendorData });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async vendorRegister(req, res) {
        try {
            const { ownerName, businessName, email, username, password, businessCategory, description, referenceWebsite } = req.body;

            const existingVendor = await Vendor.findOne({ username });

            if (existingVendor) {
                return res.status(400).json({ message: "Username already exists" });
            }

            const newVendor = new Vendor({
                ownerName,
                businessName,
                email,
                username,
                password,
                businessCategory,
                description,
                referenceWebsite
            });

            await newVendor.save();
            const token = newVendor.createAccessToken();
            const { password: pass, __v, createdAt, referenceWebsite: refWeb, updatedAt, ...vendorData } = newVendor.toObject();
            vendorData.token = token;

            res.status(201).json(vendorData);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }

    }
    static async getAllVendors(req, res) {
        try {
            const vendors = await Vendor.find();
            res.json(vendors);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async getVendorById(req, res) {
        try {
            const vendorId = req.user?.id;
            if (!mongoose.Types.ObjectId.isValid(vendorId)) {
                return res.status(400).json({ message: "Invalid vendor ID" });
            }

            const vendor = await Vendor.findById(vendorId);
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }

            const pipeline = [
                {
                    $match: {
                        "products.owner": new mongoose.Types.ObjectId(vendorId),
                        "isDeleted": false
                    }
                },
                {
                    $unwind: "$products"
                },
                {
                    $match: {
                        "products.owner": new mongoose.Types.ObjectId(vendorId)
                    }
                },
                {
                    $addFields: {
                        week: { $dateTrunc: { date: "$createdAt", unit: "week" } },
                        month: { $dateTrunc: { date: "$createdAt", unit: "month" } },
                        year: { $year: "$createdAt" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        completedOrders: { $sum: { $cond: [{ $eq: ["$paymentStatus", "completed"] }, 1, 0] } },
                        totalPendingAmount: {
                            $sum: {
                                $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$products.total", 0]
                            }
                        },
                        totalCompletedAmount: {
                            $sum: {
                                $cond: [{ $eq: ["$paymentStatus", "completed"] }, "$products.total", 0]
                            }
                        },
                        weeklyTotal: {
                            $sum: {
                                $cond: [{ $eq: ["$week", { $dateTrunc: { date: new Date(), unit: "week" } }] }, "$products.total", 0]
                            }
                        },
                        currentMonthTotal: {
                            $sum: {
                                $cond: [{ $eq: ["$month", { $dateTrunc: { date: new Date(), unit: "month" } }] }, "$products.total", 0]
                            }
                        },
                        currentYearTotal: {
                            $sum: {
                                $cond: [{ $eq: ["$year", { $year: new Date() }] }, "$products.total", 0]
                            }
                        }
                    }
                }
            ];

            const data = await Order.aggregate(pipeline);
            const totalProducts = await Product.countDocuments({ addedBy: vendorId })
            const stats = data.length > 0 ? data[0] : {};
            stats.totalProducts = totalProducts;
            res.json({ vendor, stats });
        } catch (error) {
            console.error("Vendor.controller.js:119 ~ VendorController ~ getVendorById ~ error:", error);
            res.status(500).json({ message: error.message });
        }
    }
    static async getVendorOrders(req, res) {
        try {
            const vendorId = new mongoose.Types.ObjectId(req.user?.id);
            const { page = 1, limit = 10, startDate, endDate } = req.query;

            const start = startDate ? new Date(startDate) : new Date("2000-01-01");
            const end = endDate ? new Date(endDate) : new Date();

            const pipeline = [
                {
                    $match: {
                        "createdAt": { $gte: start, $lte: end },
                        "isDeleted": false
                    }
                },
                { $unwind: "$products" },
                {
                    $match: {
                        "products.owner": vendorId
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        customer: { $first: "$customer" },
                        referenceWebsite: { $first: "$referenceWebsite" },
                        totalAmount: { $first: "$totalAmount" },
                        status: { $first: "$status" },
                        shippingAddress: { $first: "$shippingAddress" },
                        paymentStatus: { $first: "$paymentStatus" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        products: { $push: "$products" }
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: parseInt(limit) }
            ];


            const orders = await Order.aggregate(pipeline);

            const totalOrders = await Order.countDocuments({
                "products.owner": vendorId,
                "createdAt": { $gte: start, $lte: end },
                "isDeleted": false
            });

            res.json({
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit),
                currentPage: parseInt(page),
                orders
            });
        } catch (error) {
            console.error("Error in getVendorOrders:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
    static async getVendorWallet(req, res) {
        try {
            const vendorId = req.user?.id;
            if (!vendorId) {
                return res.status(400).json({ message: "Vendor ID is required" });
            }

            const { page = 1, limit = 10, startDate, endDate } = req.query;

            const start = startDate ? new Date(startDate) : new Date("2000-01-01");
            const end = endDate ? new Date(endDate) : new Date();

            const pipeline = [
                { $unwind: "$products" },
                {
                    $match: {
                        "products.owner": new mongoose.Types.ObjectId(vendorId),
                        "isDeleted": false,
                        "paymentStatus": "completed",
                        "createdAt": { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by date only
                        totalAmount: { $sum: "$products.total" }, // Sum total per date
                        orderIds: { $push: "$_id" } // Optional: Store order IDs for reference
                    }
                },
                { $sort: { _id: -1 } }, // Sort by date (latest first)
                { $skip: (parseInt(page) - 1) * parseInt(limit) }, // Pagination: skip
                { $limit: parseInt(limit) } // Pagination: limit
            ];

            const data = await Order.aggregate(pipeline);
            res.json({ success: true, data, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            console.error("Error in getVendorWallet:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

}