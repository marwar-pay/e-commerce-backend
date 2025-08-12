import express from "express";
import cors from "cors";
import { DBConnection } from "./src/db.js";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";
import orderRoutes from "./src/routes/order.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import websiteRoutes from "./src/routes/website.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import catergoriesRoutes from "./src/routes/category.routes.js";
import policyRoutes from "./src/routes/policy.routes.js";
import bannerRoutes from "./src/routes/banner.routes.js";

import { phonePeController } from "./src/routes/payment.routes.js";
import { getDashboardData } from "./src/routes/dashboard.routes.js";
import { fileURLToPath } from "url";
import vendorRoutes from "./src/routes/vendor.routes.js";
import { isAdmin } from "./src/middleware/isAdmin.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "./src/uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/website", websiteRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/categories", catergoriesRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/policy", policyRoutes);

app.post("/api/phonepe-payment", phonePeController);
app.get("/api/dashboard", isAdmin, getDashboardData);
app.use("/api", vendorRoutes);

app.use("/api/banner", bannerRoutes);

// 67888fb90e1c6b678401302d

DBConnection();

app.get("/", (req, res) => {
  res.send("server running well");
});

app.use((err, req, res, next) => {
  console.error("Error occurred: ", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ message }); // Respond with the error message
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
