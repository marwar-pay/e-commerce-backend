import express from "express";
import { registerUser, logInUser,updateUserRole, logoutUser, adminLogin, getAllUsers, getUserDetails } from "../controller/auth.controller.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const authRoutes = express.Router();

authRoutes.use(express.urlencoded({ extended: true }));
authRoutes.use(express.json());

authRoutes.post("/signUp", registerUser);
authRoutes.post("/logIn", logInUser);
authRoutes.post("/admin_login", adminLogin)
authRoutes.get("/userInfo", verifyToken, getUserDetails)
authRoutes.get("/logOut", logoutUser);
authRoutes.get("/allusers", isAdmin, getAllUsers)
authRoutes.put('/updateRole/:userId',isAdmin, updateUserRole);

export default authRoutes;
