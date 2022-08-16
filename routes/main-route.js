const express = require('express');
const router = express.Router();
const mainController = require('../controllers/main-controller');

router.get('/', mainController.home);

router.get('/pesa', mainController.tinyPesa);

router.post('/record', mainController.pesaData);

module.exports = router;