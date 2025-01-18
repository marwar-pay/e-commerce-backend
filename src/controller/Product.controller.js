import Product from "../models/Product.model.js";
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
            discount
        });
        await product.save();
        res.status(201).json({ message: "Product added successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Failed to add product", error: error.message });
    }
};


export const getProducts = async (req, res) => {
    try {
        const { referenceWebsite } = req.query;
        if (!referenceWebsite) {
            return res.status(400).json({ message: "Reference website is required" });
        }
        const website = await Websitelist.findById(referenceWebsite);
        if (!website) {
            return res.status(403).json({ message: "Unauthorized. Reference website not found or invalid" });
        }
        const products = await Product.find({ referenceWebsite });
        if (products.length === 0) {
            return res.status(404).json({ message: "No products found for this reference website" });
        }
        res.status(200).json({ message: "Products retrieved successfully", products });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve products", error: error.message });
    }
};



// Retrieve a single product by ID
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
