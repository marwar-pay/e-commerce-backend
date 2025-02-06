import Order from "../models/Order.model.js";
import User from "../models/User.model.js";
import Product from "../models/Product.model.js";
import mongoose from "mongoose";

export const getDashboardData = async (req, res) => {
    try {
        const user = req.user;

        const userAggregation = await User.aggregate([
            ...(user.role === "super-admin" ? [] : [{ $match: { role: "user", referenceWebsite: new mongoose.Types.ObjectId(user.referenceWebsite) } }]),
            {
                $unwind: "$referenceWebsite", // Unwind to group by reference website
            },
            {
                $group: {
                    _id: "$referenceWebsite", // Group by reference website
                    totalUsers: { $sum: 1 }, // Count of users
                },
            },
            {
                $lookup: {
                    from: "websitelists", // Join with the Websitelist collection
                    localField: "_id",
                    foreignField: "_id",
                    as: "websiteDetails",
                },
            },
            {
                $unwind: "$websiteDetails", // Unwind to access website details
            },
            {
                $project: {
                    referenceWebsite: "$websiteDetails.websiteName", // Reference website name
                    totalUsers: 1,
                },
            },
        ]);

        const productMatchConditions = [];

        if (user.role === "admin") {
            productMatchConditions.push({
                $match: { referenceWebsite: new mongoose.Types.ObjectId(user.referenceWebsite) }
            });
        } else if (user.role !== "super-admin") { // Applies to non-super-admin & non-admin roles
            productMatchConditions.push({
                $match: {
                    referenceWebsite: new mongoose.Types.ObjectId(user.referenceWebsite),
                    addedBy: new mongoose.Types.ObjectId(user.id?.toString())
                }
            });
        }

        const productAggregation = await Product.aggregate([
            ...productMatchConditions,
            {
                $lookup: {
                    from: "productcategories", // Join with ProductCategory collection
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
            {
                $unwind: "$categoryDetails", // Unwind to access category details
            },
            {
                $group: {
                    _id: "$category", // Group by category
                    totalProducts: { $sum: 1 }, // Count of products
                },
            },
            {
                $lookup: {
                    from: "productcategories", // Join with the ProductCategory collection
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
            {
                $unwind: "$categoryDetails", // Unwind to access category details
            },
            {
                $project: {
                    category: "$categoryDetails.name", // Category name
                    totalProducts: 1,
                },
            },
        ]);

        const orderMatchConditions = [];

        if (user.role === "admin") {
            orderMatchConditions.push({
                $match: { referenceWebsite: new mongoose.Types.ObjectId(user.referenceWebsite) }
            });
        } else if (user.role !== "super-admin") {
            orderMatchConditions.push(
                {
                    $match: {
                        referenceWebsite: new mongoose.Types.ObjectId(user.referenceWebsite),
                        products: {
                            $elemMatch: { owner: new mongoose.Types.ObjectId(user.id.toString()) }
                        }
                    }
                },
                {
                    $unwind: "$products"
                },
                {
                    $match: {
                        "products.owner": new mongoose.Types.ObjectId(req.user.id.toString()) // Filter only this 
                    }
                },
            );
        }

        const data = await Order.aggregate([
            ...orderMatchConditions,
            {
                $unwind: "$products"
            },
            {
                $facet: {
                    byStatus: [
                        {
                            $group: {
                                _id: "$status", // Group by order status
                                totalOrders: { $sum: 1 }, // Count of orders
                                totalAmount: { $sum: "$products.total" }, // Sum of total amounts
                            },
                        },
                    ],
                    byPaymentStatus: [
                        {
                            $group: {
                                _id: "$paymentStatus", // Group by payment status
                                totalOrders: { $sum: 1 }, // Count of orders
                                totalAmount: { $sum: "$products.total" }, // Sum of total amounts
                            },
                        },
                    ],
                    overall: [
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 }, // Total count of all orders
                                totalAmount: { $sum: "$products.total" }, // Total sum of all amounts
                            },
                        },
                    ],
                },
            },
        ]);

        const formattedData = {
            byStatus: data[0]?.byStatus || [],
            byPaymentStatus: data[0]?.byPaymentStatus || [],
            overall: data[0]?.overall[0] || { totalOrders: 0, totalAmount: 0 },
        };
        res.status(200).json({
            success: true,
            data: {
                userStats: userAggregation || [],
                productStats: productAggregation || [],
                orders: formattedData,
            },
        });
    } catch (error) {
        console.error("Error in getDashboardData:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: error.message,
        });
    }
};

