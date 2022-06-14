const express = require('express');
const conversationsController = require('../controllers/conversationsController');

const router = express.Router();

router.get('/', conversationsController.fetchChats);
router.post('/', conversationsController.createNewChat);
router.put('/:id', conversationsController.updateChat);
router.delete('/:id', conversationsController.deleteGroup);

module.exports = router;
