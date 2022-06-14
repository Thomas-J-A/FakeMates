const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/google', authController.signInWithGoogle);

router.get('/google/callback', authController.signInWithGoogleCallback);

router.post('/email', authController.signInWithEmail);

router.post('/register', authController.signUpWithEmail);

router.post('/logout', authController.logout);

module.exports = router;
