const mongoose = require('mongoose');

const { Schema } = mongoose;

const friendRequestSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: Number,
    enum: [1, 2, 3],  // 1=Pending, 2=Accepted, 3=Rejected
    default: 1,
  },
}, { timestamps: true });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
