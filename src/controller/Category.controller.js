import ProductCategory from "../models/Catergroy.model.js";
import Websitelist from "../models/Website.model.js";
import { uploadToCloudinary } from "../helper/cloudinary.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description, referenceWebsite } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    let category = await ProductCategory.findOne({ name });

    if (category && !referenceWebsite) {
      return res
        .status(400)
        .json({ message: "Category with this name already exists." });
    }

    const categoryImageFile = req.file?.path;
    if (!categoryImageFile) {
      return res.status(400).json({ message: "Category image is required." });
    }

    const categoryImage = await uploadToCloudinary(categoryImageFile);

    if (!category) {
      category = new ProductCategory({
        name,
        description,
        image: categoryImage.url
      });
      await category.save();
    }

    if (referenceWebsite) {
      await Websitelist.findByIdAndUpdate(referenceWebsite, {
        $addToSet: { categories: category._id },
      });
    }
    res.status(200).json({
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create category.",
      error: error.message,
    });
  }
};

// Get all product categories
export const getCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find();
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch categories.", error: error.message });
  }
};

// Get a single product category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ProductCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }
    res.status(200).json(category);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch category.", error: error.message });
  }
};

// Update a product category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    const categoryImageFile = req.file?.path;
    if (!categoryImageFile) {
      return res.status(400).json({ message: "Category image is required." });
    }

    const categoryImage = await uploadToCloudinary(categoryImageFile);
    if (!categoryImage) {
      return res.status(500).json({ message: "Error uploading image" });
    }

    const category = await ProductCategory.findByIdAndUpdate(
      id,
      { name, description, image: categoryImage.url },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    res
      .status(200)
      .json({ message: "Category updated successfully.", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update category.", error: error.message });
  }
};

// Delete a product category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ProductCategory.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }
    res.status(200).json({ message: "Category deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete category.", error: error.message });
  }
};
