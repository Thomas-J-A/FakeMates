const mongoose = require('mongoose');

const { Schema } = mongoose;

const conversationSchema = new Schema({
  name: String,
  avatarUrl: String,
  type: {
    type: String,
    enum: ['Private', 'Group'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  deletedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
