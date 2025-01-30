import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const { Schema } = mongoose;

const userSchema = new mongoose.Schema({
  referenceWebsite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Websitelist",
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
  },
  address: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
  },
  company: {
    type: String,
    default: ""
  },
  gstInNumber: {
    type: String,
    default: ""
  },
  isRequestedForVendor: {
    type: Boolean,
    default: false
  }
});

// Method to create an access token
userSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role, referenceWebsite: this.referenceWebsite },
    process.env.SECRET_KEY,
    { expiresIn: "1d" }
  );
};

// Method to create a refresh token
userSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role, referenceWebsite: this.referenceWebsite },
    process.env.REFRESH_SECRET_KEY,
    { expiresIn: "7d" }
  );
};

const User = mongoose.model("User", userSchema);

export default User;
