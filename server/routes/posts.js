const express = require('express');
const postsController = require('../controllers/postsController');

const router = express.Router();

// router.method(path, authentication, authorization, validation, controller)

router.get('/', postsController.fetchPosts);

router.post('/', postsController.createPost);

router.put('/:id', postsController.likePost);

router.delete('/:id', postsController.removePost);

module.exports = router;
