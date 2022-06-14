const express = require('express');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

router.get('/', notificationsController.fetchNotifications);
router.put('/:id', notificationsController.handleNotification);

module.exports = router;
