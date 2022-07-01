const express = require('express');

const authController = require('../controllers/auth.controller');
const authValidation = require('../validations/auth.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/google', authController.signInWithGoogle);

router.get('/google/callback', authController.signInWithGoogleCallback);

router.post('/email', validate(authValidation.signInWithEmail), authController.signInWithEmail);

router.post('/register', validate(authValidation.signUpWithEmail), authController.signUpWithEmail);

router.post('/logout', authController.logout);

module.exports = router;
