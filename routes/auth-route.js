const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth-controller');

router.get('/', authController.getUsers);
router.get('/admin', authController.getAdmins);
router.get('/region', authController.getRegions);

module.exports = router;