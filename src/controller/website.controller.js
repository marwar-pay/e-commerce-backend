import Websitelist from "../models/Website.model.js";

// 1. Create a new Website Entry
export const createWebsite = async (req, res) => {
    try {
        const { websiteName, websiteDescription, websiteURL, categories = [] } = req.body;

        if (!websiteName || !websiteURL) {
            return res.status(400).json({ message: "Website name and URL are required." });
        }

        const newWebsite = new Websitelist({
            websiteName,
            websiteDescription,
            websiteURL,
            categories,
        });

        await newWebsite.save();

        res.status(201).json({
            message: "Website created successfully.",
            website: newWebsite,
        });
    } catch (error) {
        console.error("Error in createWebsite:", error);
        res.status(500).json({ message: "Failed to create website.", error: error.message });
    }
};

// 2. Get all websites
export const getAllWebsites = async (req, res) => {
    try {
        const websites = await Websitelist.find().populate("categories", "name");

        if (!websites.length) {
            return res.status(404).json({ message: "No websites found." });
        }

        res.status(200).json({
            message: "Websites retrieved successfully.",
            websites,
        });
    } catch (error) {
        console.error("Error in getAllWebsites:", error);
        res.status(500).json({ message: "Failed to retrieve websites.", error: error.message });
    }
};

// 3. Get a specific website by ID
export const getWebsiteById = async (req, res) => {
    try {
        const { websiteId } = req.params;

        const website = await Websitelist.findById(websiteId).populate("categories", "name");

        if (!website) {
            return res.status(404).json({ message: "Website not found." });
        }

        res.status(200).json({
            message: "Website retrieved successfully.",
            website,
        });
    } catch (error) {
        console.error("Error in getWebsiteById:", error);
        res.status(500).json({ message: "Failed to retrieve website.", error: error.message });
    }
};

// 4. Update a Website
export const updateWebsite = async (req, res) => {
    try {
        const { websiteId } = req.params;
        const { websiteName, websiteDescription, websiteURL, activeStatus, categories } = req.body;

        const website = await Websitelist.findById(websiteId);

        if (!website) {
            return res.status(404).json({ message: "Website not found." });
        }
        website.websiteName = websiteName || website.websiteName;
        website.websiteDescription = websiteDescription || website.websiteDescription;
        website.websiteURL = websiteURL || website.websiteURL;
        website.activeStatus = activeStatus !== undefined ? activeStatus : website.activeStatus;

        if (categories) {
            website.categories = categories;
        }

        await website.save();

        res.status(200).json({
            message: "Website updated successfully.",
            website,
        });
    } catch (error) {
        console.error("Error in updateWebsite:", error);
        res.status(500).json({ message: "Failed to update website.", error: error.message });
    }
};

// 5. Delete a Website
export const deleteWebsite = async (req, res) => {
    try {
        const { websiteId } = req.params;

        if (!websiteId) {
            return res.status(400).json({ message: "Website ID is required." });
        }

        const website = await Websitelist.findByIdAndDelete(websiteId);

        if (!website) {
            return res.status(404).json({ message: "Website not found." });
        }

        res.status(200).json({
            message: "Website deleted successfully.",
        });
    } catch (error) {
        console.error("Error in deleteWebsite:", error);
        res.status(500).json({ message: "Failed to delete website.", error: error.message });
    }
};
