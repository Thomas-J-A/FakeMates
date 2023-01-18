const mongoose = require('mongoose');

const { Schema } = mongoose;

const actionSourcesSchema = new Schema({
  friendRequest: {                           // Not needed? friend request 'notifications' are fetched via a different API 
    type: Schema.Types.ObjectId,
    ref: 'FriendRequest',
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  message: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
});

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
  // actionSource: {
  //   type: Schema.Types.ObjectId, 
  //   // ref: <Specify 'model' option dynamically in 'populate' call>
  // },
  actionSources: actionSourcesSchema,
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  deletedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);


//  const actionTypes = [
//   `${ friend } created a new ${ post }`,
//   `${ friend } liked your ${ post }`,
//  ];
