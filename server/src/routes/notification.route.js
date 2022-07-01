const express = require('express');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', notificationController.fetchNotifications);
router.put('/:id', notificationController.handleNotification);

module.exports = router;
