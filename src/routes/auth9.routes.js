import express from "express";
import { logInUser, logoutUser, registerUser } from "../controller/auth9.controller.js";

const authRoutes9 = express.Router();

authRoutes9.use(express.urlencoded({ extended: true }));
authRoutes9.use(express.json());

authRoutes9.post("/signUp9", registerUser);
authRoutes9.post("/logIn9", logInUser);
authRoutes9.post("/logOut9", logoutUser);

export default authRoutes9;
