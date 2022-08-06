const express = require('express');
const passport = require('passport');

const userController = require('../controllers/user.controller');
const userValidation = require('../validations/user.validation');
const upload = require('../middlewares/upload');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/:id', 
  passport.authenticate('jwt', { session: false }),
  validate(userValidation.fetchUserInfo.params, 'params'),
  userController.fetchUserInfo
);

router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  upload('any'), // Validates and stores multipart data (profile/background images) // Only executed on 'action=upload' requests
  validate(userValidation.updateUserInfo.params, 'params'),
  validate(userValidation.updateUserInfo.query, 'query'),
  (req, res, next) => {
    // Validate request body if editing profile info
    req.query.action === 'edit'
      ? validate(userValidation.updateUserInfo.body, 'body')(req, res, next) // validate returns a middleware function which in turn must be invoked
      : next();
  },
  userController.updateUserInfo
);

router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(userValidation.updateUserInfo.params, 'params'),
  userController.deleteAccount
);

module.exports = router;

// TODO: possibly refactor the single endpoint '/api/users/:id' where different
// actions are sent as queries into separate endpoints for each action
// Would result in more explicit code, although with more boilerplate and breaking of REST principles

// /api/users/:id?action=edit     => /api/users/:id/edit 
// /api/users/:id?action=upload   => /api/users/:id/upload
// /api/users/:id?action=unfriend => /api/users/:id/unfriend
// /api/users/:id?action=logout   => /api/users/:id/logout
