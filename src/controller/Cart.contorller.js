import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';  // Assuming you have a Product model

// 1. Add Item to Cart
export const addItemToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const userId = req.user?.id;

        console.log(req.user)

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        if (!productId || !quantity) {
            return res.status(400).json({ message: 'Product ID and Quantity are required.' });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        // Find user's cart or create a new one
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [{ product: productId, quantity, price: product.price, total: product.price * quantity }],
                totalAmount: product.price * quantity,
            });
        } else {
            const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
            if (existingItemIndex > -1) {
                const item = cart.items[existingItemIndex];
                item.quantity += quantity;
                item.total = item.quantity * item.price;
            } else {
                cart.items.push({ product: productId, quantity, price: product.price, total: product.price * quantity });
            }
        }
        cart.totalAmount = cart.items.reduce((total, item) => total + item.total, 0);
        await cart.save();
        res.status(200).json({ message: 'Item added to cart successfully', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
    }
};


export const updateCartItemQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user?.id;
        if (!userId || !productId || !quantity) {
            return res.status(400).json({ message: 'User ID, Product ID, and Quantity are required.' });
        }
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for the user.' });
        }
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in the cart.' });
        }
        const item = cart.items[itemIndex];
        item.quantity = quantity;
        item.total = item.quantity * item.price;
        cart.totalAmount = cart.items.reduce((total, item) => total + item.total, 0);
        await cart.save();
        res.status(200).json({ message: 'Cart item updated successfully', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update cart item', error: error.message });
    }
};

// 3. Remove Item from Cart
export const removeItemFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user?.id;
        if (!userId || !productId) {
            return res.status(400).json({ message: 'User ID and Product ID are required.' });
        }
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for the user.' });
        }
        const updatedItems = cart.items.filter(item => item.product.toString() !== productId);
        if (updatedItems.length === 0) {
            await Cart.deleteOne({ user: userId });
            return res.status(200).json({ message: 'Cart is now empty' });
        }
        cart.items = updatedItems;
        cart.totalAmount = cart.items.reduce((total, item) => total + item.total, 0);
        await cart.save();
        res.status(200).json({ message: 'Item removed from cart successfully', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
    }
};

// 4. Get Cart for a User
export const getCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }
        const cart = await Cart.findOne({ user: userId }).populate('items.product', 'productName images price actualPrice discount');
        if (!cart) {
            return res.status(404).json({ message: 'No cart found for the user.' });
        }
        res.status(200).json({ message: 'Cart retrieved successfully', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve cart', error: error.message });
    }
};

// 5. Checkout Cart
export const checkoutCart = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'No cart found for the user.' });
        }
        cart.isCheckedOut = true;
        cart.lastUpdated = Date.now();
        await cart.save();

        res.status(200).json({ message: 'Cart checked out successfully', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to checkout cart', error: error.message });
    }
};
