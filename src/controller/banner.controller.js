import Banner from "../models/Banner.model.js";
import { uploadToCloudinary } from "../helper/cloudinary.js";

export const createBanner = async (req, res) => {
  try {
    const { altText, page } = req.body;
    if (!altText || !page) {
      return res.status(400).json({ message: "all fields are required" });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "Image file is required" });
    }
    const bannerImagePath = req.file.path;

    const bannerImage = await uploadToCloudinary(bannerImagePath);
    if (!bannerImage) {
      return res.status(500).json({ message: "Error uploading image" });
    }

    const newBanner = new Banner({ imageUrl: bannerImage.url, altText, page });
    await newBanner.save();
    res.status(201).json(newBanner);
  } catch (error) {
    res.status(500).json({ message: "Error creating banner", error });
  }
};

export const getBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ page: req.params?.page });
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { altText, page } = req.body;
    if (!id || !altText || !page) {
      return res.status(400).json({ message: "all fields are required" });
    }
    const bannerImagePath = req.file?.path;
    const bannerImage = await uploadToCloudinary(bannerImagePath);
    if (!bannerImage) {
      return res.status(500).json({ message: "Error uploading image" });
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { altText, imageUrl: bannerImage.url, page },
      { new: true }
    );
    if (!updatedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json(updatedBanner);
  } catch (error) {
    res.status(500).json({ message: "Error updating banner", error });
  }
};
