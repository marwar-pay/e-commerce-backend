import Banner from "../models/Banner.model.js";
import { uploadToCloudinary } from "../helper/cloudinary.js";

export const createBanner = async (req, res) => {
  try {
    const { altText, page, referenceWebsite } = req.body;
    if (!altText || !page || !referenceWebsite) {
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

    const newBanner = new Banner({
      imageUrl: bannerImage.url,
      altText,
      page,
      referenceWebsite,
    });
    await newBanner.save();
    res.status(201).json(newBanner);
  } catch (error) {
    res.status(500).json({ message: "Error creating banner", error });
  }
};

export const getBanner = async (req, res) => {
  try {
    const banners = await Banner.find({ page: req.params?.page });
    if (!banners || banners.length === 0) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Banner ID is required" });
    }
    const { altText, page } = req.body;
    let updateData = { altText, page };

    if (req.file) {
      const bannerImagePath = req.file.path;
      const bannerImage = await uploadToCloudinary(bannerImagePath);

      if (!bannerImage) {
        return res.status(500).json({ message: "Error uploading image" });
      }

      updateData.imageUrl = bannerImage.url;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { ...updateData },
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

export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Banner ID is required" });
    }

    const deletedBanner = await Banner.findByIdAndDelete(id);
    if (!deletedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting banner", error });
  }
};
