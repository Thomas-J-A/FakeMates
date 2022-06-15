const express = require('express');
const advertisementsController = require('../controllers/advertisements.controller');

const router = express.Router();

router.get('/', advertisementsController.fetchAdvertisements);

module.exports = router;
