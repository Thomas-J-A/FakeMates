const express = require('express');
const passport = require('passport');

const authController = require('../controllers/auth.controller');
const authValidation = require('../validations/auth.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/google',
  passport.authenticate('google',
    {
      session: false,
      scope: ['profile', 'email'],
    }
  )
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  authController.continueWithGoogle
);

router.post('/email',
  validate(authValidation.signInWithEmail),
  authController.signInWithEmail
);

router.post('/register',
  validate(authValidation.signUpWithEmail),
  authController.signUpWithEmail
);

router.post('/logout',
  authController.logout
);
 
module.exports = router;

// You set { session: false } because you do not want to store the user details in a session. 
// You expect the user to send the token on each request to the secure routes.

// passport.authenticate("jwt", { session: false }), (req, res) => {})
