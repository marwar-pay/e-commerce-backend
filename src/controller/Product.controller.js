import Product from "../models/Product.model.js";
import mongoose from "mongoose";
import Websitelist from "../models/Website.model.js"; // Import the Websitelist model

export const createProduct = async (req, res) => {
    try {
        const { referenceWebsite, productName, images, discount, price, actualPrice, category, description, size } = req.body;
        const imageArray = Array.isArray(images) ? images : [images];
        const productSize = size || "M";
        if (actualPrice < 0 || actualPrice > price) {
            return res.status(400).json({
                message: "Invalid actualPrice. It must be a positive value and less than or equal to price.",
            });
        }
        const product = new Product({
            referenceWebsite,
            productName,
            images: imageArray,
            price,
            actualPrice: actualPrice || 0,
            category,
            description,
            size: productSize,
            discount,
            addedBy: req.user?.id?.toString(),
        });
        await product.save();
        res.status(200).json({ message: "Product added successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Failed to add product", error: error.message });
    }
};
export const getProducts = async (req, res) => {
    try {
        const {
            referenceWebsite,
            category,
            search,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10,
        } = req.query;

        if (!referenceWebsite) {
            return res.status(400).json({ message: "Reference website is required" });
        }

        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;

        const user = req.user?.id?.toString();
        const role = req.user?.role;

        // Build the match stage for filtering
        const matchStage = { referenceWebsite: new mongoose.Types.ObjectId(referenceWebsite) };

        if (category) {
            matchStage.category = new mongoose.Types.ObjectId(category);
        }

        if (role && role !== "admin" && role !== "super-admin") matchStage.addedBy = new mongoose.Types.ObjectId(user);

        if (search) {
            matchStage.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (minPrice || maxPrice) {
            matchStage.actualPrice = {};
            if (minPrice) matchStage.actualPrice.$gte = parseFloat(minPrice);
            if (maxPrice) matchStage.actualPrice.$lte = parseFloat(maxPrice);
        }

        const pipeline = [
            { $match: matchStage }, // Match documents based on filters
            {
                $lookup: {
                    from: 'productcategories', // Ensure this matches your actual collection name
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true, // Retain products without a category
                },
            },
            {
                $addFields: {
                    category: {
                        _id: '$category._id',
                        name: '$category.name',
                    },
                },
            },
            {
                $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
            },
            {
                $facet: {
                    metadata: [
                        { $count: 'totalDocuments' },
                        {
                            $addFields: {
                                currentPage: pageNumber,
                                pageSize,
                                totalPages: { $ceil: { $divide: ['$totalDocuments', pageSize] } },
                            },
                        },
                    ],
                    products: [
                        { $skip: (pageNumber - 1) * pageSize },
                        { $limit: pageSize },
                    ],
                },
            },
        ];

        const results = await Product.aggregate(pipeline);

        const metadata = results[0]?.metadata[0] || {
            totalDocuments: 0,
            currentPage: pageNumber,
            pageSize,
            totalPages: 0,
        };
        const products = results[0]?.products || [];

        res.status(200).json({
            products,
            pagination: metadata,
        });
    } catch (error) {
        console.error('Error in getProducts:', error.message);
        res.status(500).json({ message: 'Failed to retrieve products', error: error.message });
    }
};

// export const getProducts = async (req, res) => {
//     try {
//         const {
//             referenceWebsite,
//             search,
//             category, // Specific category filter
//             minPrice,
//             maxPrice,
//             sortBy = 'createdAt', // Sorting field
//             sortOrder = 'desc',   // Sorting order
//             page = 1,
//             limit = 10,
//         } = req.query;

//         const user = req.user?.id?.toString();
//         const role = req.user?.role;

//         if (!referenceWebsite) {
//             return res.status(400).json({ message: "Reference website is required" });
//         }

//         const pageNumber = parseInt(page, 10) || 1;
//         const pageSize = parseInt(limit, 10) || 10;

//         const website = await Websitelist.findById(referenceWebsite);
//         if (!website) {
//             return res.status(404).json({ message: "Reference website not found" });
//         }

//         if (website?.categories.length === 0) {
//             return res.status(200).json({
//                 products: [],
//                 pagination: {
//                     totalDocuments: 0,
//                     currentPage: pageNumber,
//                     pageSize,
//                     totalPages: 0,
//                 },
//             });
//         }

//         const matchStage = {
//             category: { $in: website.categories }, // Only products in website's categories
//         };

//         if (role && role !== "admin") matchStage.addedBy = user;

//         if (category) {
//             matchStage.category = new mongoose.Types.ObjectId(category);
//         }

//         if (search) {
//             matchStage.$or = [
//                 { productName: { $regex: search, $options: 'i' } },
//                 { description: { $regex: search, $options: 'i' } },
//             ];
//         }

//         if (minPrice || maxPrice) {
//             matchStage.actualPrice = {};
//             if (minPrice) matchStage.actualPrice.$gte = parseFloat(minPrice);
//             if (maxPrice) matchStage.actualPrice.$lte = parseFloat(maxPrice);
//         }

//         const pipeline = [
//             { $match: matchStage },
//             {
//                 $lookup: {
//                     from: 'productcategories', // Name of the categories collection
//                     localField: 'category',
//                     foreignField: '_id',
//                     as: 'category',
//                 },
//             },
//             {
//                 $unwind: {
//                     path: '$category',
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $addFields: {
//                     category: {
//                         _id: '$category._id',
//                         name: '$category.name',
//                     },
//                 },
//             },
//             {
//                 $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
//             },
//             {
//                 $facet: {
//                     metadata: [
//                         { $count: 'totalDocuments' },
//                         {
//                             $addFields: {
//                                 currentPage: pageNumber,
//                                 pageSize,
//                                 totalPages: { $ceil: { $divide: ['$totalDocuments', pageSize] } },
//                             },
//                         },
//                     ],
//                     products: [
//                         { $skip: (pageNumber - 1) * pageSize },
//                         { $limit: pageSize },
//                     ],
//                 },
//             },
//         ];

//         // Execute the aggregation pipeline
//         const results = await Product.aggregate(pipeline);

//         const metadata = results[0]?.metadata[0] || {
//             totalDocuments: 0,
//             currentPage: pageNumber,
//             pageSize,
//             totalPages: 0,
//         };
//         const products = results[0]?.products || [];

//         // Return the response
//         res.status(200).json({
//             products,
//             pagination: metadata,
//         });
//     } catch (error) {
//         console.error('Error in getProducts:', error.message);
//         res.status(500).json({ message: 'Failed to retrieve products', error: error.message });
//     }
// };

export const getProductDetail = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ message: "Product retrieved successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve product", error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { productName, images, price, actualPrice, discount, category, description, size } = req.body;
        const imageArray = Array.isArray(images) ? images : [images];
        const productSize = size || "M";
        if (actualPrice < 0 || actualPrice > price) {
            return res.status(400).json({
                message: "Invalid actualPrice. It must be a positive value and less than or equal to price.",
            });
        }
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                productName,
                images: imageArray,
                price,
                actualPrice: actualPrice || 0,
                category,
                description,
                size: productSize,
                discount
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product updated successfully", updatedProduct });
    } catch (error) {
        res.status(500).json({ message: "Failed to update product", error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product deleted successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
};
