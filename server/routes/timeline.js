const express = require('express');
const timelineController = require('../controllers/timelineController');

const router = express.Router();

router.get('/', timelineController.fetchTimeline);

module.exports = router;
