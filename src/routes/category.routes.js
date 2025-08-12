import express from 'express';
import upload from '../middleware/multerConfig.js';
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from '../controller/Category.controller.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

router.post('/', isAdmin, upload.single('categoryImage'), createCategory);
router.get('/', getCategories);
router.get('/:id', isAdmin, getCategoryById);
router.put('/:id', isAdmin, upload.single('categoryImage'), updateCategory);
// Route to delete a category by ID
router.delete('/:id', isAdmin, deleteCategory);

export default router;
