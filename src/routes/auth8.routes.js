import express from "express";
import { logInUser, logoutUser, registerUser } from "../controller/auth8.controller.js";

const authRoutes8 = express.Router();

authRoutes8.use(express.urlencoded({ extended: true }));
authRoutes8.use(express.json());

authRoutes8.post("/signUp8", registerUser);
authRoutes8.post("/logIn8", logInUser);
authRoutes8.post("/logOut8", logoutUser);

export default authRoutes8;
