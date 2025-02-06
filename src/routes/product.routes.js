import express from "express";
import { createProduct, deleteProduct, getProductDetail, getProducts, updateProduct } from "../controller/Product.controller.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const productRoutes = express.Router();

productRoutes.post("/createproduct", isAdmin, createProduct);
productRoutes.get("/getproducts", getProducts);
productRoutes.get("/getproduct/:id", getProductDetail);

productRoutes.delete("/delete/:id", isAdmin, deleteProduct);
productRoutes.put("/products/:id", isAdmin, updateProduct);

export default productRoutes;
