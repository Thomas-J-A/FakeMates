const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema({
  actor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  recipients: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  actionType: {
    type: Number,
    enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  actionSource: {
    type: Schema.Types.ObjectId, 
    // ref: <Specify 'model' option dynamically in 'populate' call>
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  deletedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Notifications', notificationSchema);
