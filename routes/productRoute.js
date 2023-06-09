const express = require('express');
const formidable = require('express-formidable');
const router = express.Router()
const { requireSignIn, isAdmin} = require('../middlewares/authMiddleware');
const { deleteProductController, createProductController, UpdateProductController, getAllProductsController, getProductController, getProductPhotoController, getFilterController, brainTreeTokenController, brainTreePaymentController, paymentController } = require('../controllers/productController');



// Product Routes

// Route for creating products
router.post('/create-product', requireSignIn, isAdmin, formidable(), createProductController);

// Route for deleting products
router.delete('/delete-product/:pid', requireSignIn, isAdmin, deleteProductController)

// Route for updating products
router.put('/update-product/:id', requireSignIn, isAdmin, UpdateProductController)

// Route for getting all products
router.get('/all', getAllProductsController);

// Route for getting single product
router.get('/:slug', getProductController);

// Route for getting photo of the product
router.get('/product-photo/:pid', getProductPhotoController)

// Route for the filter
router.post('/product-filter', getFilterController)

// Route for the Payments
// Token
router.get('/braintree/token', brainTreeTokenController)

// Route for The payments
router.post('/create-checkout-session', paymentController);



module.exports = router;