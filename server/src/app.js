const express = require('express');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const passport = require('passport');

const connectToDatabase = require('./configs/db.config');
const configurePassport = require('./configs/passport.config');

// Import routes
const authRouter = require('./routes/auth.route');
const timelineRouter = require('./routes/timeline.route');
const postRouter = require('./routes/post.route');
const commentRouter = require('./routes/comment.route');
const advertisementRouter = require('./routes/advertisement.route');
const friendRequestRouter = require('./routes/friend-request.route');
const notificationRouter = require('./routes/notification.route');
const userRouter = require('./routes/user.route');
const searchRouter = require('./routes/search.route');
const conversationRouter = require('./routes/conversation.route');
const messageRouter = require('./routes/message.route');

// Import models
const Post = require('./models/post.model');
const Comment = require('./models/comment.model');
const Advertisement = require('./models/advertisement.model');
const FriendRequest = require('./models/friend-request.model');
const Notification = require('./models/notification.model');
const User = require('./models/user.model');
const Conversation = require('./models/conversation.model');
const Message = require('./models/message.model');

// Set up environment variables
require('dotenv').config({ path: '../.env'});

// Create Express app
const app = express();

// Database setup
if (process.env.NODE_ENV !== 'test') {
  connectToDatabase();
}

// Passport setup
configurePassport(passport); 

// Set up middlewares
app.use(logger('dev'));
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:8080', // React client
  credentials: true, // Allow cookies to be sent
}));
app.use('/public', express.static(path.join(__dirname, 'public'))); // Serve static files from ./public directory
app.use(express.json());
app.use(cookieParser()); // Parses Cookie headers and populates req.cookies (req.cookies.<cookieName>)

// Add models to req object so no need to to import into each file
app.use((req, res, next) => {
  req.models = {
    Post,
    Comment,
    Advertisement,
    FriendRequest,
    Notification,
    User,
    Conversation,
    Message,
  };

  next();
});

// Express routes
app.use('/api/auth', authRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/posts', postRouter);
app.use('/api/comments', commentRouter);
app.use('/api/advertisements', advertisementRouter);
app.use('/api/friend-requests', friendRequestRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/users', userRouter);
app.use('/api/search', searchRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);

// Handle undefined routes
app.use((req, res, next) => {
  const err = new Error('Not found');
  err.status = 404;
  next(err);
});

// Error handler for 404 responses
// and unhandled internal errors (datebase errors, etc)
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({ message: err.message });
});

module.exports = app;
