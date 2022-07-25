const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop-controller');

router.get('/', shopController.getProducts);
router.get('/category', shopController.getCategories);

module.exports = router;