const mongoose = require('mongoose');

const { Schema } = mongoose;

const postSchema = new Schema({
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  content: String,
  mediaUrl: String,
  likedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  commentsCount: Number,
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
