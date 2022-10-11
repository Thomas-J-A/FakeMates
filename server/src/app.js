const express = require('express');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');

// Import routes
const indexRouter = require('./routes/index.route');

// Import models
const models = require('./models/index.model');

// Set up environment variables
require('dotenv').config({ path: '../.env'});

// Create Express app
const app = express();

// Prod/Dev db setup
// Test db setup happens in test util file
if (process.env.NODE_ENV !== 'test') require('./configs/db.config');

// Passport setup
require('./configs/passport.config')(passport);

// Set up middlewares
if (process.env.NODE_ENV !== 'test') app.use(logger('dev'));
app.use(cors({
  origin: 'http://192.168.8.146:8080', // React client
  // origin: 'http://localhost:8080',  // React client
  credentials: true, // Allow cookies to be sent
}));
app.use(helmet());
app.use('/public', express.static(path.join(__dirname, '../public'))); // Serve static files from ./public directory
app.use(express.json());
app.use(cookieParser()); // Parses Cookie header and populates req.cookies (req.cookies.<cookieName>)
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true,
//   store: MongoStore.create({
//     mongoUrl: process.env.MONGO_URI_PROD,
//   }),
// }));
app.use(passport.initialize());
// app.use(passport.session());

// Add models to req object so no need to import into each file
app.use((req, res, next) => {
  req.models = models;

  next();
});

// Mount all routes
app.use('/api', indexRouter);

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
