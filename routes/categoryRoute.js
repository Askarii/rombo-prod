const express = require('express');
const router = express.Router()
const { requireSignIn, isAdmin} = require('../middlewares/authMiddleware');
const { createCategoryController, updateCategoryController, getAllCategoryController, getSingleCategoryController, deleteCategoryController } = require('../controllers/categoryController');

// Routes
// Create category Route
router.post('/create-category', requireSignIn, isAdmin, createCategoryController )

// Update category Route
router.put('/update-category/:id', requireSignIn, isAdmin, updateCategoryController)

// Get All Category Route
router.get('/', getAllCategoryController)

// Get Single Category Route
router.get('/:slug', getSingleCategoryController)

// Delete Category Route
router.delete('/delete-category/:id', requireSignIn, isAdmin, deleteCategoryController)


module.exports = router;
