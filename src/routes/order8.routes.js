import express from "express";
import { createOrder, deleteOrder, getOrder, getOrders, updateOrderStatus } from "../controller/order8.controller.js";
import { verifyToken8 } from './../middleware/verifyToken8.js';

const orderRoutes8 = express.Router();

orderRoutes8.post("/orders8", verifyToken8, createOrder);         // Create an order
orderRoutes8.get("/orders8", verifyToken8, getOrders);            // Get all orders
orderRoutes8.get("/orders8/:id", verifyToken8, getOrder);         // Get a specific order
orderRoutes8.put("/orders8/:id/status", verifyToken8, updateOrderStatus);  // Update order status
orderRoutes8.delete("/orders8/:id", verifyToken8, deleteOrder);   // Delete an order

export default orderRoutes8;
