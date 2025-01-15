import express from "express";
import cors from "cors";
import { DBConnection } from "./src/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import productRoutes from "./src/routes/product.routes.js"; // Assuming you have the product routes file
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import orderRoutes from "./src/routes/order.routes.js";
import authRoutes2 from "./src/routes/auth2.routes.js";
import productRoutes2 from "./src/routes/product2.routes.js";
import orderRoutes2 from "./src/routes/order2.routes.js";
import authRoutes5 from "./src/routes/auth5.routes.js";
import productRoutes5 from "./src/routes/product5.routes.js";
import orderRoutes5 from "./src/routes/order5.routes.js";
import authRoutes3 from "./src/routes/auth3.routes.js";
import productRoutes3 from "./src/routes/product3.routes.js";
import orderRoutes3 from "./src/routes/order3.routes.js";
import authRoutes4 from "./src/routes/auth4.routes.js";
import productRoutes4 from "./src/routes/product4.routes.js";
import orderRoutes4 from "./src/routes/order4.routes.js";
import authRoutes6 from './src/routes/auth6.routes.js';
import productRoutes6 from './src/routes/product6.routes.js';
import orderRoutes6 from './src/routes/order6.routes.js';
import authRoutes7 from "./src/routes/auth7.routes.js";
import productRoutes7 from "./src/routes/product7.routes.js";
import orderRoutes7 from "./src/routes/order7.routes.js";
import authRoutes8 from "./src/routes/auth8.routes.js";
import productRoutes8 from "./src/routes/product8.routes.js";
import orderRoutes8 from "./src/routes/order8.routes.js";
import authRoutes9 from "./src/routes/auth9.routes.js";
import productRoutes9 from "./src/routes/product9.routes.js";
import orderRoutes9 from "./src/routes/order9.routes.js";
import authRoutes10 from "./src/routes/auth10.routes.js";
import productRoutes10 from "./src/routes/product10.routes.js";
// import orderRoutes10 from "./src/routes/order10.routes.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);

app.use("/api/auth2", authRoutes2);
app.use("/api/product2", productRoutes2);
app.use("/api/order2", orderRoutes2);

app.use("/api/auth3", authRoutes3);
app.use("/api/product3", productRoutes3);
app.use("/api/order3", orderRoutes3);

app.use("/api/auth4", authRoutes4);
app.use("/api/product4", productRoutes4);
app.use("/api/order4", orderRoutes4);

app.use("/api/auth5", authRoutes5);
app.use("/api/product5", productRoutes5);
app.use("/api/order5", orderRoutes5);

app.use("/api/auth6", authRoutes6);
app.use("/api/product6", productRoutes6);
app.use("/api/order6", orderRoutes6);

app.use("/api/auth7", authRoutes7);
app.use("/api/product7", productRoutes7);
app.use("/api/order7", orderRoutes7);


app.use("/api/auth8", authRoutes8);
app.use("/api/product8", productRoutes8);
app.use("/api/order8", orderRoutes8);

app.use("/api/auth9", authRoutes9);
app.use("/api/product9", productRoutes9);
app.use("/api/order9", orderRoutes9);

app.use("/api/auth10", authRoutes10);
app.use("/api/product10", productRoutes10);
// app.use("/api/order10", orderRoutes10);



DBConnection();

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
