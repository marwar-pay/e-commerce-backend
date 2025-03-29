import Vendor from "../models/Vendor.model.js";
import jwt from 'jsonwebtoken';

export class VendorController {
    static async vendorLogin(req, res) {
        try {
            const { username, password, referenceWebsite } = req.body;
            if (!username || !password) {
                return res.status(400).json({ message: "Username and password are required" });
            }
            const vendor = await Vendor.findOne({ username, referenceWebsite });

            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }

            if (vendor.password !== password) {
                return res.status(401).json({ message: "Invalid password" });
            }

            const token = vendor.createAccessToken();

            const { password: pass, __v, createdAt, referenceWebsite: refWeb, updatedAt, ...vendorData } = vendor.toObject();

            vendorData.password = undefined;
            vendorData.token = token;

            res.json({ message: "Login successful", vendorData });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async vendorRegister(req, res) {
        try {
            const { ownerName, businessName, email, username, password, businessCategory, description, referenceWebsite } = req.body;

            const existingVendor = await Vendor.findOne({
                referenceWebsite,
                $or: [{ email }, { username }]
            });

            if (existingVendor) {
                return res.status(400).json({ message: "Email or Username already exists" });
            }

            const newVendor = new Vendor({
                ownerName,
                businessName,
                email,
                username,
                password,
                businessCategory,
                description,
                referenceWebsite
            });

            await newVendor.save();
            const token = newVendor.createAccessToken();
            const { password: pass, __v, createdAt, referenceWebsite: refWeb, updatedAt, ...vendorData } = newVendor.toObject();
            vendorData.token = token;

            res.status(201).json(vendorData);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }

    }
    static async getAllVendors(req, res) {
        try {
            const vendors = await Vendor.find();
            res.json(vendors);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async getVendorById(req, res) {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return res.status(404).json({ message: 'Vendor not found' });
            }
            res.json(vendor);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}