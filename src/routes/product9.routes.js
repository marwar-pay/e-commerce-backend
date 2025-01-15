import express from "express";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "../controller/Product9.controller.js";

const productRoutes9 = express.Router();

productRoutes9.post("/createproduct9", createProduct);
productRoutes9.get("/getproducts9", getProducts);
productRoutes9.get("/getproduct9/:id", getProduct);
productRoutes9.delete("/delete9/:id", deleteProduct);
productRoutes9.put("/products9/:id", updateProduct);

export default productRoutes9;
