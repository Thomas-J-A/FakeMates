const express = require('express');
const commentController = require('../controllers/comment.controller');

const router = express.Router();

router.get('/', commentController.fetchComments);
router.post('/', commentController.createComment);
router.put('/:id', commentController.likeComment);

module.exports = router;
