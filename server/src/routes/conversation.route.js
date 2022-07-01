const express = require('express');
const conversationController = require('../controllers/conversation.controller');

const router = express.Router();

router.get('/', conversationController.fetchChats);
router.post('/', conversationController.createNewChat);
router.put('/:id', conversationController.updateChat);
router.delete('/:id', conversationController.deleteGroup);

module.exports = router;
