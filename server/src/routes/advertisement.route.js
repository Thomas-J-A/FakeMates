const express = require('express');
const advertisementController = require('../controllers/advertisement.controller');

const router = express.Router();

router.get('/', advertisementController.fetchAdvertisements);

module.exports = router;
