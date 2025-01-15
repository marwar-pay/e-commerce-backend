import express from "express";
import { logInUser, logoutUser, registerUser } from "../controller/auth10.controller.js";

const authRoutes10 = express.Router();

authRoutes10.use(express.urlencoded({ extended: true }));
authRoutes10.use(express.json());

authRoutes10.post("/signUp10", registerUser);
authRoutes10.post("/logIn10", logInUser);
authRoutes10.post("/logOut10", logoutUser);

export default authRoutes10;
