const mongoose = require('mongoose');

const { Schema } = mongoose;

const conversationSchema = new Schema({
  name: String,
  avatarUrl: {
    type: String,
    default: '../../../images/group-avatar.jpg',
  },
  type: {
    type: String,
    enum: ['private', 'group'],
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  deletedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

conversationSchema.pre('remove', async function(next) {
  try {
    // Remove all associated messages
    await mongoose.model('Message').deleteMany({ conversationId: this._id }).exec();

    next();
  } catch (err) {
    next(err);
  }
})

module.exports = mongoose.model('Conversation', conversationSchema);
