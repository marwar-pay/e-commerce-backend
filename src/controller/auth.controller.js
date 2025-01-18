import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';

dotenv.config({ path: "../.env" });

export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, referenceWebsite, mobile, address, role } = req.body;

    if (!firstName || !lastName || !email || !password || !referenceWebsite) {
      return res.status(400).json({ msg: "All fields are required." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "This email is already registered. Please login." });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const userData = await User.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      referenceWebsite,
      mobile,
      address,
      role: role || 'user'
    });
    const accessToken = userData.createAccessToken();
    const refreshToken = userData.createRefreshToken();
    userData.password = undefined;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      userData,
      accessToken,
      message: "You have successfully registered!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Registration failed", error: error.message });
  }
};


export const logInUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "No account found with this email. Please sign up." });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ msg: "Invalid password." });
    }

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',  // Ensure this is true in production (HTTPS required)
      sameSite: "Strict",
    };

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    });

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,  // 1 day
    });

    user.password = undefined;

    return res.status(200).json({
      userData: user,
      msg: "You have logged in successfully",
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ msg: "Login failed", error: error.message });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ msg: "User details not found." });
    }
    const userDetail = await User.findById(user.id);
    res.status(200).json({
      user:userDetail,
      msg: "User details fetched successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Failed to fetch user details.", error: error.message });
  }
};


export const logoutUser = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  res.status(200).json({ message: "You have successfully logged out!" });
};


export const getAllUsers = async (req, res) => {
  try {
    const { referenceWebsite } = req.query; // Get the referenceWebsite ID from query parameters
    const query = referenceWebsite ? { referenceWebsite } : {};
    const users = await User.find(query)
      .populate("referenceWebsite", "websiteName websiteURL")
      .select("-password"); // Exclude the password field
    if (!users || users.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ msg: "Failed to fetch users", error: error.message });
  }
};
