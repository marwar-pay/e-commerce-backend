import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";


dotenv.config({ path: "../.env" });

export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, referenceWebsite, mobile, address, role } = req.body;

    if (!firstName || !lastName || !email || !password || !referenceWebsite) {
      return res.status(400).json({ msg: "All fields are required." });
    }
    const existingUser = await User.findOne({ email, referenceWebsite });
    if (existingUser) {
      return res.status(400).json({ msg: "User already registered with this website." });
    }

    // if (existingUser) {
    //   if (!existingUser.referenceWebsite.includes(referenceWebsite)) {
    //     existingUser.referenceWebsite.push(referenceWebsite);
    //     await existingUser.save();
    //     return res.status(200).json({
    //       msg: "Reference website added to existing user.",
    //       userData: existingUser,
    //     });
    //   } else {
    //     return res.status(400).json({ msg: "User already registered with this website." });
    //   }
    // }
    const hashPassword = await bcrypt.hash(password, 10);
    const userData = await User.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      referenceWebsite,
      mobile,
      address,
      role: role || "user",
    });

    const accessToken = userData.createAccessToken();
    const refreshToken = userData.createRefreshToken();
    userData.password = undefined;

    // Set cookies for tokens
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
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });
    // Respond with user data and access token
    res.status(200).json({
      userData,
      refreshToken,
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
    const { email, password, referenceWebsite } = req.body;

    if (!email || !password || !referenceWebsite) {
      return res.status(400).json({ msg: "Email, password, and reference website are required." });
    }

    const user = await User.findOne({ email, referenceWebsite });
    if (!user) {
      return res.status(400).json({ msg: "No account found with this email. Please sign up." });
    }
    // Check if the user is registered for the given reference website
    // if (!user.referenceWebsite.includes(referenceWebsite)) {
    //   return res.status(400).json({
    //     msg: `You need to register on ${referenceWebsite} before logging in.`,
    //   });
    // }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ msg: "Invalid password." });
    }

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Ensure this is true in production
      sameSite: "Strict",
    };

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    user.password = undefined;

    return res.status(200).json({
      userData: user,
      msg: "You have logged in successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ msg: "Login failed", error: error.message });
  }
};



export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email, password, and reference website are required." });
    }
    // const user = await User.findOne({ email,  });

    let user = await User.findOne({
      email, role: "super-admin"
    })

    user ??= await User.findOne({
      email: email,
      role: { $in: ['admin', 'vendor'] }
    });
    console.log("file: auth.controller.js:141 ~ adminLogin ~ user:", user);

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
      secure: process.env.NODE_ENV === "production", // Ensure this is true in production
      sameSite: "Strict",
    };
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    user.password = undefined;
    return res.status(200).json({
      userData: user,
      msg: "You have logged in successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log("file: auth.controller.js:170 ~ adminLogin ~ error:", error);
    res.status(500).json({ msg: "Login failed", error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params; // User ID from URL params
    const { role } = req.body; // New role from request body
    const validRoles = ['user', 'admin', 'vendor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ msg: 'Invalid role provided.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }
    user.role = role;
    await user.save();
    res.status(200).json({
      msg: 'User role updated successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Failed to update user role.', error: error.message });
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available via middleware (e.g., JWT auth)
    const { firstName, lastName, email, mobile, address, password } = req.body;

    if (!userId) {
      return res.status(400).json({ msg: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    // Prepare updates
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (mobile) updates.mobile = mobile;
    if (address) updates.address = address;

    // If password is provided, hash it before updating
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    // Update user details
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    // Remove sensitive data before sending the response
    updatedUser.password = undefined;

    res.status(200).json({
      msg: "Profile updated successfully.",
      userData: updatedUser,
    });
  } catch (error) {
    console.error("Error in editProfile:", error);
    res.status(500).json({ msg: "Failed to update profile.", error: error.message });
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
      user: userDetail,
      msg: "User details fetched successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Failed to fetch user details.", error: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  res.status(200).json({ message: "You have successfully logged out!" });
};

export const getAllUsers = async (req, res) => {
  try {
    const {
      referenceWebsite, // Array of ObjectIds
      search,
      sortField = "firstName",
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;
    const filter = {};
    if (referenceWebsite) {
      filter.referenceWebsite = {
        $in: referenceWebsite.split(",").map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    if (search) {
      const regex = new RegExp(search, "i"); // Case-insensitive search
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
      ];
    }
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };
    const users = await User.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .select("-password"); // Exclude the password field
    const totalUsers = await User.countDocuments(filter);
    if (!users || users.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }
    res.status(200).json({
      total: totalUsers,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(totalUsers / pageSize),
      data: users,
    });
  } catch (error) {
    console.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ msg: "Failed to fetch users", error: error.message });
  }
};


