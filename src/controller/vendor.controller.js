import User from "../models/User.model.js";
import Vendor from "../models/Vendor.model.js";
import Order from '../models/Order.model.js'
import mongoose from "mongoose";
import Product from "../models/Product.model.js";

export class VendorController {
    static async VendorRequest(req, res) {
        try {
            const { gstInNumber, company } = req.body;
            const user = req.user;
            const userDetails = await User.findById(user.id.toString());
            if (!userDetails) {
                return res.status(404).json({ message: 'User not found.' });
            }
            if (userDetails.isRequestedForVendor && user.role !== 'vendor') {
                return res.status(403).json({ message: 'Forbidden. You have already requested to become a vendor' });
            } else if (user.isRequestedForVendor && user.role === 'vendor') {
                return res.status(403).json({ message: 'Forbidden. You are already a vendor.' });
            }

            await User.findByIdAndUpdate(user.id.toString(),
                {
                    gstInNumber, company, isRequestedForVendor: true
                }
            )

            res.status(200).json({ message: 'Vendor request received.' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to handle vendor request.', error: error.message });
        }
    }

    static async AcceptVendorRequest(req, res) {
        try {
            const { userId } = req.params;
            const { accept, commissionRate } = req.body;
            const user = req.user;
            if (user.role !== 'admin') {
                return res.status(403).json({ message: 'Forbidden. Only admins can accept vendor requests.' });
            }

            if (accept && !commissionRate) {
                return res.status(400).json({ message: 'Commission rate is required to accept vendor request.' });
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                accept
                    ? { role: 'vendor', commissionRate }
                    : { isRequestedForVendor: false, gstInNumber: '', company: '' },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found.' });
            }

            res.status(200).json({ message: 'Vendor request accepted.' });

        } catch (error) {
            res.status(500).json({ message: 'Failed to accept vendor request.', error: error.message });
        }
    }

    static async incomingVendorRequests(req, res) {
        try {
            const user = req.user;
            if (user.role !== 'admin') {
                return res.status(403).json({ message: 'Forbidden. You are not authorized to access this' });
            }
            const users = await User.find({ isRequestedForVendor: true, role: 'user' });
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch incoming vendor requests.', error: error.message });
        }
    }

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

            const categoriesPipeline = [
                {
                    "$match": {
                        "addedBy": new mongoose.Types.ObjectId(vendorId) // Replace with vendor's ID
                    }
                },
                {
                    "$lookup": {
                        "from": "productcategories",
                        "localField": "category",
                        "foreignField": "_id",
                        "as": "categoryDetails"
                    }
                },
                {
                    "$unwind": "$categoryDetails"
                },
                {
                    "$group": {
                        "_id": "$categoryDetails.name",
                        "count": { "$sum": 1 }
                    }
                },
                {
                    "$group": {
                        "_id": null,
                        "categoryCounts": {
                            "$push": {
                                "k": "$_id",
                                "v": "$count"
                            }
                        }
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "categoryCounts": { "$arrayToObject": "$categoryCounts" }
                    }
                }
            ]


            const data = await Order.aggregate(pipeline);
            const categoriesData = await Product.aggregate(categoriesPipeline);
            const totalProducts = await Product.countDocuments({ addedBy: vendorId })
            const stats = data.length > 0 ? data[0] : {};
            stats.totalProducts = totalProducts;
            stats.categories = categoriesData.length > 0 ? categoriesData[0].categoryCounts : {};
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
                    $unwind: "$products"
                },
                {
                    $match: {
                        "products.owner": new mongoose.Types.ObjectId(vendorId)
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
                // Lookup user details
                {
                    $lookup: {
                        from: "users",
                        localField: "customer",
                        foreignField: "_id",
                        as: "customerDetails"
                    }
                },
                {
                    "$addFields": {
                        "customer": {
                            "$mergeObjects": [
                                {
                                    "firstName": { "$arrayElemAt": ["$customerDetails.firstName", 0] },
                                    "lastName": { "$arrayElemAt": ["$customerDetails.lastName", 0] },
                                    "email": { "$arrayElemAt": ["$customerDetails.email", 0] },
                                    "_id": { "$arrayElemAt": ["$customerDetails._id", 0] },
                                }
                            ]
                        }
                    }
                }
                ,
                {
                    $project: {
                        customerDetails: 0
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "products.product",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                {
                    "$addFields": {
                        "products": {
                            "$map": {
                                "input": "$products",
                                "as": "prod",
                                "in": {
                                    "$mergeObjects": [
                                        "$$prod",
                                        {
                                            "product": {
                                                "$arrayElemAt": [
                                                    {
                                                        "$filter": {
                                                            "input": "$productDetails",
                                                            "as": "pd",
                                                            "cond": { "$eq": ["$$pd._id", "$$prod.product"] }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                // Remove the full productDetails array
                {
                    $project: {
                        productDetails: 0
                    }
                },
                // Project out unwanted fields from productName
                {
                    $project: {
                        "products.productName.images": 0,
                        "products.productName.actualPrice": 0,
                        "products.productName.size": 0,
                        "products.productName.discount": 0,
                        "products.productName.addedBy": 0,
                        "products.productName.createdAt": 0,
                        "products.productName.updatedAt": 0,
                        "products.productName.__v": 0,
                        "products.productName.referenceWebsite": 0,
                        "products.productName.category": 0
                    }
                }
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