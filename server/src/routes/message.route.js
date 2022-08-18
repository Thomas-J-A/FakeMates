const express = require('express');
const passport = require('passport');

const messageController = require('../controllers/message.controller');
const messageValidation = require('../validations/message.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  validate(messageValidation.fetchMessages.query, 'query'),
  messageController.fetchMessages
);

router.post('/',
  passport.authenticate('jwt', { session: false }),
  validate(messageValidation.sendMessage.body, 'body'),
  messageController.sendMessage
);

// URL Breaks REST principles but is a sensible way to
// add batch updates to resources of the same type
// (Update readBy array for all messages belonging to a particular chat)
router.post('/actions',
  passport.authenticate('jwt', { session: false }),
  validate(messageValidation.markAsRead.body, 'body'),
  messageController.markAsRead
);

// Update readBy array for a single message
// router.put('/:id',
//   passport.authenticate('jwt', { session: false }),
//   validate(messageValidation.markMessageAsRead.params, 'params'),
//   messageController.markMessageAsRead
// );

module.exports = router;
