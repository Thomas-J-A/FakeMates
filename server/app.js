const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectToDatabase = require('./config/database');

// Import routes
const authRouter = require('./routes/auth');
const timelineRouter = require('./routes/timeline');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const advertisementsRouter = require('./routes/advertisements');
const friendRequestsRouter = require('./routes/friend-requests');
const notificationsRouter = require('./routes/notifications');
const usersRouter = require('./routes/users');
const searchRouter = require('./routes/search');
const conversationsRouter = require('./routes/conversations');
const messagesRouter = require('./routes/messages');

// Import models
const Post = require('./models/post');
const Comment = require('./models/comment');
const Advertisement = require('./models/advertisement');
const FriendRequest = require('./models/friend-request');
const Notification = require('./models/notification');
const User = require('./models/user');
const Conversation = require('./models/conversation');
const Message = require('./models/message');

// Set up environment variables
require('dotenv').config({ path: '../.env'});

// Create Express app
const app = express();

// Database setup
connectToDatabase();

// Passport setup

// Set up middlewares
app.use(morgan('dev'));
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
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/advertisements', advertisementsRouter);
app.use('/api/friend-requests', friendRequestsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/search', searchRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/messages', messagesRouter);

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
