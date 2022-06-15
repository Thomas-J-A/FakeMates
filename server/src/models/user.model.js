const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  location: String,
  hometown: String,
  occupation: String,
  bio: String,
  avatarUrl: String,
  backgroundUrl: String,
  isOnline: Boolean,
  lastOnline: Date,
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

// Hash password before saving document to db
// In middleware, 'this' refers to the document itself
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
