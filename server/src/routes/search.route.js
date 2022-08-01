const express = require('express');
const passport = require('passport');

const searchController = require('../controllers/search.controller');
const searchValidation = require('../validations/search.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  validate(searchValidation.fetchResults.query, 'query'),
  searchController.fetchResults
);

module.exports = router;
