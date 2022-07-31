const express = require('express');
const passport = require('passport');

const notificationController = require('../controllers/notification.controller');
const notificationValidation = require('../validations/notification.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  validate(notificationValidation.fetchNotifications.query, 'query'),
  notificationController.fetchNotifications
);

router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(notificationValidation.handleNotification.params, 'params'),
  validate(notificationValidation.handleNotification.query, 'query'),
  notificationController.handleNotification
);

module.exports = router;
