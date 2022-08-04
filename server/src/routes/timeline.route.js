const express = require('express');
const passport = require('passport');


const timelineController = require('../controllers/timeline.controller');
const timelineValidation = require('../validations/timeline.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  validate(timelineValidation.fetchTimeline.query, 'query'),
  timelineController.fetchTimeline
);

module.exports = router;
