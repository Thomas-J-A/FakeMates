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
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // lastMessage: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'Message',
  // },
  deletedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
