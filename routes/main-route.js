const express = require('express');
const router = express.Router();
const mainController = require('../controllers/main-controller');

router.get('/', mainController.home);

router.post('/', mainController.results);

module.exports = router;