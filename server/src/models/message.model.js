const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  content: String,
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  deletedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
