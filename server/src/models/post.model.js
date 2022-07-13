const { promises: fs } = require('fs');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const postSchema = new Schema({
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  content: String,
  imageUrl: String,
  likedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  commentsCount: Number,
}, { timestamps: true });

postSchema.pre('remove', async function(next) {
  try {
    // Delete associated comments
    console.log('Deleting associated comments...');

    if (this.imageUrl) {
      // Delete associated image
      await fs.unlink(this.imageUrl);
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Post', postSchema);
