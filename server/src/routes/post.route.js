const express = require('express');
const passport = require('passport');

const postController = require('../controllers/post.controller');
const postValidation = require('../validations/post.validation');
const upload = require('../middlewares/upload');
const validate = require('../middlewares/validate');

const router = express.Router();

// router.method(path, authentication, authorization, validation, controller)

router.get('/',
  passport.authenticate('jwt', { session: false }),
  validate(postValidation.fetchPosts.query, 'query'),
  postController.fetchPosts
);

router.post('/',
  passport.authenticate('jwt', { session: false }),
  upload('single', 'image'), // file validation done here
  validate(postValidation.createPost.body, 'body'), // all other validation done here
  postController.createPost
);

router.get('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(postValidation.fetchPost.params, 'params'),
  postController.fetchPost
);

router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(postValidation.likePost.params, 'params'),
  postController.likePost
);

router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  validate(postValidation.removePost.params, 'params'),
  postController.removePost
);

module.exports = router;
