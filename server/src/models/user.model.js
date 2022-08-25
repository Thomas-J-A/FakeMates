const { promises: fs } = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const findOrCreate = require('mongoose-findorcreate');

const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  fullName: String,
  email: String,
  password: String,
  location: String,
  hometown: String,
  occupation: String,
  bio: String,
  avatarUrl: {
    type: String,
    default: '../../../public/images/avatar.svg',
  },
  backgroundUrl: {
    type: String,
    default: '../../../public/images/background.jpg',
  },
  isPrivate: {
    type: Boolean,
    default: true,
  },
  isOnline: {
    type: Boolean,
    default: true,
  },
  lastOnline: Date,
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

// userSchema
//   .virtual('fullName')
//   .get(function() {
//     return `${ this.firstName } ${ this.lastName }`;
//   });

// Hash password before saving document to db
// In middleware, 'this' refers to the document itself
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Store a fullName field to enable complete regex matches when searching users
userSchema.pre('save', async function(next) {
  try {
    if (!(this.isModified('firstName') || this.isModified('lastName'))) return next();

    this.fullName = `${ this.firstName } ${ this.lastName }`;
    next(); 
  } catch (err) {
    next(err);
  }
});

// TODO: refactor into multiple pre('remove') hooks based on service
userSchema.pre('remove', async function(next) {
  try {
    // Remove associated posts and all their comments
    const posts = await mongoose.model('Post').find({ postedBy: this._id }).exec();

    for (const post of posts) {
      // Calling remove method on document instance means pre remove middleware runs
      await post.remove();
    };
    
    // Remove associated friend requests
    await mongoose.model('FriendRequest').deleteMany({
      $or: [
        { from: this._id },
        { to: this._id },
      ]
    }).exec();
    
    // Mark associated notifications as 'deleted' for this user
    // so that other recipients can continue to view them, or
    // remove entirely if all recipients mark as deleted
    const notifications = await mongoose.model('Notification').find({
      recipients: { $in: [this._id] }
    }).exec();

    for (const notification of notifications) {
      notification.deletedBy.push(this._id);

      notification.recipients.length === notification.deletedBy.length
        ? await notification.remove()
        : await notification.save();
    }
      
    // Remove userId from all friend's friends lists
    await mongoose.model('User').updateMany(
      { friends: { $in: [this._id] } },
      { $pull : { friends: this._id } },
    ).exec();
      
    // Remove uploaded avatar, if it exists (not the default)
    if (!this.avatarUrl.match(/avatar.svg$/)) {
      await fs.unlink(this.avatarUrl);
    }
    
    // Remove uploaded background image, if it exists (not the default)
    if (!this.backgroundUrl.match(/background.jpg$/)) {
      await fs.unlink(this.backGroundUrl);
    }
    
    // Remove user's likes from all posts
    await mongoose.model('Post').updateMany(
      { likedBy: { $in: [this._id] } },
      { $pull: { likedBy: this._id }},
      ).exec();
      
    // Remove user's likes from all comments
    await mongoose.model('Comment').updateMany(
      { likedBy: { $in: [this._id] } },
      { $pull: { likedBy: this._id } },
    ).exec();
      
    // Remove user from all conversations and
    // update all associated messages
    const conversations = await mongoose.model('Conversation').find({
      members: { $in: [this._id] }
    }).exec();

    for (const conversation of conversations) {
      // Remove user from member's array
      conversation.members = conversation.members.filter((id) => !id.equals(this._id));

      // Check if all members have now deleted this conversation
      const isDeletedAll = conversation.members.every((member) => conversation.deletedBy.includes(member));

      // Remove record (and cascade deleted associated messages) if all members have marked conversation
      // as deleted, otherwise inform other members and selectively delete messages
      if (isDeletedAll) {
        await conversation.remove();
      } else {
        // Let other members know that a member is no longer available
        let messageContent = `${ this.fullName } is no longer available to chat.`;

        // If user is admin of a group, randomly assign a new admin from members
        if (conversation.type === 'group' && conversation.admin.equals(this._id)) {
          conversation.admin = conversation.members > 1
            ? conversation.members[Math.floor(Math.random() * conversation.members.length)]
            : conversation.members[0];

          // Let other members know who the new admin is
          await conversation.populate('admin', 'fullName');
          messageContent += ` ${ conversation.admin.fullName } is the new admin.`;
        }

        const message = new mongoose.model('Message')({
          conversationId: conversation._id,
          type: 'notification',
          content: messageContent,
        });

        await message.save();
        await conversation.save();

        // Mark all (previously undeleted) associated
        // messages as 'deleted' by current user
        const messages = await mongoose.model('Message').find()
        .and([
          { conversationId: conversation._id },
          { deletedBy: { $nin: [this._id] } },
        ])
        .exec();

        const promises = messages.map(async (message) => {
          message.deletedBy.push(this._id);

          // Mark message as 'read' for current user if not already
          // (they can also delete chat without looking at message)
          if (!message.readBy.includes(this._id)) {
            message.readBy.push(this._id);
          }

          // Check if all members have now deleted this message
          const isDeletedAll = conversation.members.every((member) => message.deletedBy.includes(member));
          isDeletedAll ? await message.remove() : await message.save();
        });

        await Promise.all(promises);
      }
    }
    
    // Continue to remove user document itself
    next();
  } catch (err) {
    console.log(err)
    next(err);
  }
  });
  
// Adds a static method to find or create a user
// when signing in/up with Google OAuth
userSchema.plugin(findOrCreate);

module.exports = mongoose.model('User', userSchema);

// Anonymize comments made on other user's posts by this user
// in order to maintain the meaning of subsequent comments in the thread
// if doc doesn't exist, populate call will return null so comment.postedBy will be null
// I can have a condition clientside checking for a null value, and if so add anonymous name or strikethrough, and avatar
// await mongoose.model('Comment').updateMany(
//   { postedBy: this._id },
//   { postedBy: null },
// ).exec();
// the above isn't needed - simply keep the now defunct userId value in comment.postedBy
// field and it will populate with the value null at runtime in handler (GET /api/comments)
