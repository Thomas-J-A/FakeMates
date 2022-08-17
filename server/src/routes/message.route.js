const express = require('express');
const passport = require('passport');

const messageController = require('../controllers/message.controller');
const messageValidation = require('../validations/message.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/', messageController.fetchMessages);

router.post('/',
  passport.authenticate('jwt', { session: false }),
  validate(messageValidation.sendMessage.body, 'body'),
  messageController.sendMessage
);

router.put('/:id', messageController.markMessageAsRead);

module.exports = router;
