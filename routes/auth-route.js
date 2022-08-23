const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth-controller');
const { body } = require('express-validator');

router.get('/', authController.getUsers);

router.get('/admin', authController.getAdmins);

router.get('/region', authController.getRegions);

router.post('/signup', [
    body('name').isLength({ min: 3 }).withMessage('Please enter a name of at least 3 characters long!'),
    body('password').isLength({ min: 8 }).withMessage('Please enter a strong password, at least 8 characters long!'),
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail address.'),
    body('phoneNumber').isLength({ min: 10 }).withMessage('Please enter a correct phone number, eg 0712345678'),
    body('region').isLength({ min: 2 }).withMessage('Please select a region')
], authController.signup);

router.post('/login', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail address'),
], authController.login);

router.post('/upgrade/:userId', authController.upgradeToAdmin);

router.post('/forgot-password', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail Address'),
], authController.forgotPassword);

router.post('/new-password/:id', [
    body('password').isLength({ min: 8 }).withMessage('Please enter a strong password, at least 8 characters long!'),
], authController.setNewPassword)

router.post('/request/region', [
    body('region').isLength({ min: 3 }).withMessage('Please enter a valid nave for a region, at least three characters')
], authController.requestRegionAdd);

router.post('/request/category', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail address'),
    body('category').isLength({ min: 3 }).withMessage('Please enter a valid nave for a region, at least three characters')
], authController.requestCategoryAdd);

router.get('/admin/subscribe/:adminId', authController.upgradeAdmin);

router.post('/admin/subcribe/check', authController.checkTransaction);


module.exports = router;