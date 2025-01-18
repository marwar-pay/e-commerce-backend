import mongoose from 'mongoose';

const productCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required.'],
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        }
    },
    { timestamps: true }
);

const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);

export default ProductCategory;
