import express from "express";
import { createOrder, deleteOrder, getOrder, getOrders, updateOrderStatus } from "../controller/order9.controller.js";
import { verifyToken9 } from './../middleware/verifyToken9.js';

const orderRoutes9 = express.Router();

orderRoutes9.post("/orders9", verifyToken9, createOrder);         // Create an order
orderRoutes9.get("/orders9", verifyToken9, getOrders);            // Get all orders
orderRoutes9.get("/orders9/:id", verifyToken9, getOrder);         // Get a specific order
orderRoutes9.put("/orders9/:id/status", verifyToken9, updateOrderStatus);  // Update order status
orderRoutes9.delete("/orders9/:id", verifyToken9, deleteOrder);   // Delete an order

export default orderRoutes9;
