import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js"; // Importing Product model to get product details
import Cart from "../models/Cart.model.js";

// Create a new order
export const createOrder = async (req, res) => {
    try {
        const { products, shippingAddress } = req.body;
        const customer = req.user?.id;
        const referenceWebsite = req.user?.referenceWebsite;
        if (!products || products.length === 0) {
            return res.status(400).json({ message: "At least one product is required" });
        }
        let totalAmount = 0;
        for (let productItem of products) {
            const product = await Product.findById(productItem.product);
            if (!product) {
                return res.status(400).json({ message: `Product not found for ID: ${productItem.product}` });
            }
            totalAmount += product.actualPrice * productItem.quantity;
        }
        const newOrder = new Order({
            referenceWebsite,
            customer,
            products,
            totalAmount,
            shippingAddress,
        });
        await newOrder.save();
        // const cart = await Cart.findOne({ user: customer });
        // if (cart) {
        //     cart.items = [];
        //     cart.totalAmount = 0;
        //     cart.isCheckedOut = true;
        //     cart.lastUpdated = Date.now();
        //     await cart.save();
        // }
        res.status(201).json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
        res.status(500).json({ message: "Failed to create order", error: error.message });
    }
};

export const getOrdersByReferenceWebsite = async (req, res) => {
    try {
        const {
            referenceWebsite,
            customerName,
            startDate,
            endDate,
            minPrice,
            maxPrice,
            page = 1,
            limit = 10
        } = req.query;

        if (!referenceWebsite) {
            return res.status(400).json({ message: "Reference website is required." });
        }

        const filter = { referenceWebsite };

        // If startDate or endDate is provided, add date filters
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // If minPrice or maxPrice is provided, add price filters
        if (minPrice || maxPrice) {
            filter['products.product.price'] = {};
            if (minPrice) filter['products.product.price'].$gte = parseFloat(minPrice);
            if (maxPrice) filter['products.product.price'].$lte = parseFloat(maxPrice);
        }

        // Pagination settings
        const skip = (page - 1) * limit;

        // Fetch orders and populate products and customers
        let orders = await Order.find(filter)
            .populate('products.product', 'productName price')
            .populate('customer', 'firstName lastName email')
            .populate('referenceWebsite', 'websiteName')
            .sort({ createdAt: -1 }) // Latest orders first
            .skip(skip)
            .limit(parseInt(limit));

        // Filter by customer name if provided
        if (customerName) {
            orders = orders.filter(order => {
                const fullName = `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase();
                return fullName.includes(customerName.toLowerCase());
            });
        }

        const totalOrders = await Order.countDocuments(filter);

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No orders found matching the criteria." });
        }

        res.status(200).json({
            orders,
            totalOrders,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrders / limit),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch orders.", error: error.message });
    }
};


export const getOrdersByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const orders = await Order.find({ customer: userId })
            .populate("products.product", "productName price")
            .populate("customer", "firstName lastName email mobile");
        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No orders found for this user" });
        }
        res.status(200).json({ message: "Orders retrieved successfully", orders });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
};

// Get a specific order by ID
export const getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, isDeleted: false }) // Exclude deleted order
            .populate("customer", "firstName lastName email mobile")
            .populate("products.product", "productName price image");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order retrieved successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve order", error: error.message });
    }
};

// Update order status (for example, when an order is shipped or delivered)
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false }, // Only update if the order is not deleted
            { status },
            { new: true } // Return the updated document
        );
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json({ message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ message: "Failed to update order status", error: error.message });
    }
};

// Delete an order
export const deleteOrder = async (req, res) => {
    try {
        // Find the order by ID and set isDeleted to true
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { new: true }  // Return the updated order
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order marked as deleted", order });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete order", error: error.message });
    }
};

