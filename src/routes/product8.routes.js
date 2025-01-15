import express from "express";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "../controller/Product8.controller.js";

const productRoutes8 = express.Router();

productRoutes8.post("/createproduct8", createProduct);
productRoutes8.get("/getproducts8", getProducts);
productRoutes8.get("/getproduct8/:id", getProduct);
productRoutes8.delete("/delete8/:id", deleteProduct);
productRoutes8.put("/products8/:id", updateProduct);

export default productRoutes8;
