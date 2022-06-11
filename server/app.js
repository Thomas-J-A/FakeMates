const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectToDatabase = require('./config/database');

// Import routes

// Import models

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
// app.use((req, res, next) => {
//   req.models = {

//   };

//   next();
// });

// Express routes
app.get('/', (req, res, next) => {
  res.send('hello world from server');
});

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
