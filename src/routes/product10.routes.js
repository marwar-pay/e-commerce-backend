import express from "express";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "../controller/Product10.controller.js";
import { verifyToken10 } from "../middleware/verifyToken10.js";

const productRoutes10 = express.Router();

productRoutes10.post("/createproduct10", verifyToken10, createProduct);
productRoutes10.get("/getproducts10", getProducts);
productRoutes10.get("/getproduct10/:id", getProduct);
productRoutes10.delete("/delete10/:id",verifyToken10, deleteProduct);
productRoutes10.put("/products10/:id",verifyToken10, updateProduct);

export default productRoutes10;
