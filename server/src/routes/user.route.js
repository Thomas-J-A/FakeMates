const express = require('express');
const passport = require('passport');

const userController = require('../controllers/user.controller');
const userValidation = require('../validations/user.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/:id', 
  passport.authenticate('jwt', { session: false }),
  validate(userValidation.fetchUserInfo.params, 'params'),
  userController.fetchUserInfo
);

router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(userValidation.updateUserInfo.params, 'params'),
  validate(userValidation.updateUserInfo.query, 'query'),
  (req, res, next) => {
    // Validate request body if editing profile
    req.query.action === 'edit'
      // validate returns a middleware function which in turn must be invoked
      ? validate(userValidation.updateUserInfo.body, 'body')(req, res, next)
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
