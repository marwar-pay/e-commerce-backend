import express from "express";
import cors from "cors";
import { DBConnection } from "./src/db.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import orderRoutes from "./src/routes/order.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import websiteRoutes from "./src/routes/website.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import catergoriesRoutes from "./src/routes/category.routes.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/website", websiteRoutes);
app.use("/api/cart", cartRoutes);
app.use('/api/categories', catergoriesRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);

// 67888fb90e1c6b678401302d

DBConnection();

app.use('/', (req, res) => {
  res.send('server running well')
})

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
