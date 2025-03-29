import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const vendorSchema = new mongoose.Schema(
    {
        ownerName: {
            type: String,
            required: true
        },
        businessName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true
        },
        businessCategory: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        currentBalance: {
            type: Number,
            default: 0
        },
        pendingBalance: {
            type: Number,
            default: 0
        },
        orderCompletedBalance: {
            type: Number,
            default: 0
        },
        totalEarnings: {
            type: Number,
            default: 0
        },
        referenceWebsite: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Websitelist",
            required: true
        },
        role: {
            type: String,
            enum: ["vendor"],
            default: "vendor"
        },
    },
    { timestamps: true }
);

vendorSchema.methods.createAccessToken = function () {
    return jwt.sign(
        { id: this._id, username: this.username, role: "vendor" },
        process.env.SECRET_KEY,
        { expiresIn: "1d" }
    );
};

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
