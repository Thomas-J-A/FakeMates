const express = require('express');
const passport = require('passport');

const conversationController = require('../controllers/conversation.controller');
const conversationValidation = require('../validations/conversation.validation');
const upload = require('../middlewares/upload');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  validate(conversationValidation.fetchChats.query, 'query'),
  conversationController.fetchChats
);
router.post('/',
  passport.authenticate('jwt', { session: false }),
  upload('single', 'avatar'),
  validate(conversationValidation.createNewChat.query, 'query'),
  (req, res, next) => {
    req.context = { type: req.query.type }; // Validation schema differs when creating private and group chats
    validate(conversationValidation.createNewChat.body, 'body')(req, res, next);
  },
  conversationController.createNewChat
);

router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(conversationValidation.updateChat.params, 'params'),
  validate(conversationValidation.updateChat.query, 'query'),  
  conversationController.updateChat
);

router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(conversationValidation.deleteGroup.params, 'params'),
  conversationController.deleteGroup
);

module.exports = router;
