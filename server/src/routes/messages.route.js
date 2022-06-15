const express = require('express');
const messagesController = require('../controllers/messages.controller');

const router = express.Router();

router.get('/', messagesController.fetchMessages);
router.post('/', messagesController.sendMessage);
router.put('/:id', messagesController.markMessageAsRead);

module.exports = router;
