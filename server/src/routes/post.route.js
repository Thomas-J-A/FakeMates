const express = require('express');
const postController = require('../controllers/post.controller');

const router = express.Router();

// router.method(path, authentication, authorization, validation, controller)

router.get('/', postController.fetchPosts);

router.post('/', postController.createPost);

router.put('/:id', postController.likePost);

router.delete('/:id', postController.removePost);

module.exports = router;
