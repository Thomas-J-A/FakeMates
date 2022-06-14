const express = require('express');
const advertisementsController = require('../controllers/advertisementsController');

const router = express.Router();

router.get('/', advertisementsController.fetchAdvertisements);

module.exports = router;
