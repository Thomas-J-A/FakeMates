const express = require('express');
const passport = require('passport');

const advertisementController = require('../controllers/advertisement.controller');

const router = express.Router();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  advertisementController.fetchAdvertisements
);

module.exports = router;
