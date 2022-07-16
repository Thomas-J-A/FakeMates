const express = require('express');
const passport = require('passport');

const commentController = require('../controllers/comment.controller');
const commentValidation = require('../validations/comment.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  validate(commentValidation.fetchComments.query, 'query'),
  commentController.fetchComments
);

router.post('/',
  passport.authenticate('jwt', { session: false }),
  validate(commentValidation.createComment.query, 'query'),
  validate(commentValidation.createComment.body, 'body'),
  commentController.createComment
);

router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(commentValidation.likeComment.params, 'params'),
  commentController.likeComment
);

module.exports = router;
