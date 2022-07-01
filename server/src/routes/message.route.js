const express = require('express');
const messageController = require('../controllers/message.controller');

const router = express.Router();

router.get('/', messageController.fetchMessages);
router.post('/', messageController.sendMessage);
router.put('/:id', messageController.markMessageAsRead);

module.exports = router;
