const express = require('express');

const authRouter = require('./auth.route');
const timelineRouter = require('./timeline.route');
const postRouter = require('./post.route');
const commentRouter = require('./comment.route');
const advertisementRouter = require('./advertisement.route');
const friendRequestRouter = require('./friend-request.route');
const notificationRouter = require('./notification.route');
const userRouter = require('./user.route');
const searchRouter = require('./search.route');
const conversationRouter = require('./conversation.route');
const messageRouter = require('./message.route');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/timeline', timelineRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);
router.use('/advertisements', advertisementRouter);
router.use('/friend-requests', friendRequestRouter);
router.use('/notifications', notificationRouter);
router.use('/users', userRouter);
router.use('/search', searchRouter);
router.use('/conversations', conversationRouter);
router.use('/messages', messageRouter);

module.exports = router;
