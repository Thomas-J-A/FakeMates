const express = require('express');
const messagesController = require('../controllers/messagesController');

const router = express.Router();

router.get('/', messagesController.fetchMessages);
router.post('/', messagesController.sendMessage);
router.put('/:id', messagesController.markMessageAsRead);

module.exports = router;
