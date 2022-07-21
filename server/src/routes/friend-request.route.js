const express = require('express');
const passport = require('passport');

const friendRequestController = require('../controllers/friend-request.controller');
const friendRequestValidation = require('../validations/friend-request.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  friendRequestController.fetchFriendRequests
);

router.post('/',
  passport.authenticate('jwt', { session: false }),
  validate(friendRequestValidation.sendFriendRequest.query, 'query'),
  friendRequestController.sendFriendRequest
);

router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(friendRequestValidation.handleFriendRequest.params, 'params'),
  validate(friendRequestValidation.handleFriendRequest.query, 'query'),
  friendRequestController.handleFriendRequest,
);

module.exports = router;
