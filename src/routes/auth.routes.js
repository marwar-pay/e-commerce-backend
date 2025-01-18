import express from "express";
import { registerUser, logInUser, logoutUser ,getAllUsers,getUserDetails} from "../controller/auth.controller.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const authRoutes = express.Router();

authRoutes.use(express.urlencoded({ extended: true }));
authRoutes.use(express.json());

authRoutes.post("/signUp", registerUser);
authRoutes.post("/logIn", logInUser);
authRoutes.get("/userInfo",verifyToken,getUserDetails)
authRoutes.post("/logOut", logoutUser);
authRoutes.get("/allusers",isAdmin,getAllUsers)

export default authRoutes;
