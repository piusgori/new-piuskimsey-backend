const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop-controller');
const adminAuthentication = require('../middleware/admin-token-checker');
const { body } = require('express-validator')

router.get('/', shopController.getProducts);

router.get('/page', shopController.productsPagination);

router.get('/category', shopController.getCategories);

router.get('/product/:productId', shopController.getProductById);

router.get('/admin/:adminId', shopController.getProductsByAdminId);

router.post('/product', [
    body('title').isLength({ min: 3 }).withMessage('Please enter a valid title for your product at least three characters long.'),
    body('price').isLength({ min: 1 }).withMessage('Please enter a valid price for your product'),
    body('category').isLength({ min: 3 }).withMessage('Please select a valid category'),
    body('description').isLength({ min: 20 }).withMessage('Please enter a valid description for your product, at least 20 characters'),
], adminAuthentication, shopController.createProduct);

router.post('/category', [
    body('title').isLength({ min: 3 }).withMessage('Please enter a valid category name of at least 3 characters'),
], adminAuthentication, shopController.createCategory);

router.post('/region', [
    body('title').isLength({ min: 3 }).withMessage('Please enter a valid region name of at least 3 characters'),
], adminAuthentication, shopController.createRegion);

router.patch('/product/:productId', adminAuthentication, shopController.editProduct);

router.patch('/image/product/:productId', [
    body('image').isLength({ min: 1 }).withMessage('Please enter a valid image name')
], shopController.addImage);

router.delete('/product/:productId', adminAuthentication, shopController.deleteProduct);

router.patch('/cart/:id', shopController.addToCart);

router.post('/order/:id', shopController.createOrder);

module.exports = router;