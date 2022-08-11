const express = require('express');
const passport = require('passport');

const conversationController = require('../controllers/conversation.controller');
const conversationValidation = require('../validations/conversation.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  validate(conversationValidation.fetchChats.query, 'query'),
  conversationController.fetchChats
);
router.post('/', conversationController.createNewChat);
router.put('/:id', conversationController.updateChat);
router.delete('/:id', conversationController.deleteGroup);

module.exports = router;
