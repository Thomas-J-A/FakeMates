const express = require('express');
const commentsController = require('../controllers/comments.controller');

const router = express.Router();

router.get('/', commentsController.fetchComments);
router.post('/', commentsController.createComment);
router.put('/:id', commentsController.likeComment);

module.exports = router;
