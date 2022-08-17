const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const models = require('../../src/models/index.model');

const seedAdvertisement = async (data = {}) => {
  const ad = new models.Advertisement({
    brandName: data.brandName || faker.company.companyName(),
    tagline: data.tagline || faker.company.bs(),
    backgroundUrl: data.backgroundUrl || faker.internet.url(),
  });

  await ad.save();

  return ad;
}

const seedFriendRequest = async (data) => {
  const friendRequest = new models.FriendRequest({
    from: data.from || new mongoose.Types.ObjectId().toString(),
    to: data.to || new mongoose.Types.ObjectId().toString(),
    status: data.status || 1,
  });

  await friendRequest.save();

  return friendRequest;
};

const seedNotification = async (data) => {
  const notification = new models.Notification({
    actor: data.actor || new mongoose.Types.ObjectId().toString(),
    recipients: data.recipients,
    actionType: data.actionType || 1,
    actionSource: data.actionSource || new mongoose.Types.ObjectId().toString(),
    readBy: data.readBy || [],
    deletedBy: data.deletedBy || [],
  });

  await notification.save();

  return notification;
};

const seedUser = async (data = {}) => {
  const user = new models.User({
    firstName: data.firstName || faker.name.firstName(),
    lastName: data.lastName || faker.name.lastName(),
    email: data.email || faker.internet.email(),
    password: data.password || faker.internet.password(),
    occupation: data.occupation || faker.name.jobTitle(),
    bio: data.bio || faker.lorem.sentence(),
    friends: data.friends || [],
  });

  await user.save();

  return user;
};

const seedPost = async (data = {}) => {
  const post = new models.Post({
    postedBy: data.postedBy || new mongoose.Types.ObjectId().toString(),
    content: data.content || faker.lorem.sentence(),
    likedBy: data.likedBy || [],
  });
  
  await post.save();

  return post;
};

const seedComment = async (data = {}) => {
  const comment = new models.Comment({
    postedBy: data.postedBy || new mongoose.Types.ObjectId().toString(),
    postId: data.postId || new mongoose.Types.ObjectId().toString(),
    content: data.content || faker.lorem.sentence(),
    likedBy: data.likedBy || [],
  });
  
  await comment.save();

  return comment;
};

const seedConversation = async (data) => {
  const conversation = new models.Conversation({
    type: data.type,
    createdBy: data.createdBy || new mongoose.Types.ObjectId().toString(),
    members: data.members,
    deletedBy: data.deletedBy || [],
  });
  
  await conversation.save();

  return conversation;
};

const seedMessage = async (data) => {
  const message = new models.Message({
    sender: data.sender,
    conversationId: data.conversationId,
    content: data.content || faker.lorem.sentence(),
    readBy: data.readBy || [],
    deletedBy: data.deletedBy || [],
  });

  await message.save();

  return message;
}

module.exports = {
  seedAdvertisement,
  seedFriendRequest,
  seedNotification,
  seedUser,
  seedPost,
  seedComment,
  seedConversation,
  seedMessage,
};
