const path = require('path');
const { promises: fs } = require('fs');
const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const {
  seedFriendRequest,
  seedNotification,
  seedUser,
  seedPost,
  seedComment,
  seedConversation,
  seedMessage,
} = require('../utils/seeds.util');
const fakeIds = require('../utils/fakeIds.util');
const models = require('../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/users/:id', () => {
  const currentUser = createAuthedUser();

  it('should fetch profile info if users are friends', async () => {
    // Seed a second user
    const user = await seedUser();

    // Add user to current user's friends
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

    const res = await api
      .get(`/api/users/${ user._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('firstName');
    expect(res.body).toHaveProperty('occupation');
    expect(res.body).toHaveProperty('bio')
    expect(res.body).toHaveProperty('friends');
  });


  it('should fetch profile info if account is public', async () => {
    // Seed a second user with a public profile
    const user = await seedUser({ isPrivate: 'false' });

    const res = await api
      .get(`/api/users/${ user._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('firstName');
    expect(res.body).toHaveProperty('occupation');
    expect(res.body).toHaveProperty('bio')
    expect(res.body).toHaveProperty('friends');
  });


  it('should return 403 if account is private and users are not friends', async () => {
    // Seed a second user
    const user = await seedUser();

    const res = await api
      .get(`/api/users/${ user._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('This account is private');
  });


  it('should return relationship status of \'pending\' if there is a pending request', async () => {
    // Seed a second user with a public profile
    const user = await seedUser({ isPrivate: 'false' });

    // Seed a pending friend request
    await seedFriendRequest({
      from: currentUser.data._id,
      to: user._id,
    });

    const res = await api
      .get(`/api/users/${ user._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.relationshipStatus).toBe('pending');
  });


  it('should return relationship status of \'accepted\' if users are friends', async () => {
    // Seed a second user (users are friends so private/public doesn't matter)
    const user = await seedUser();

    // Add user to current user's friends
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

    // Seed an accepted friend request
    await seedFriendRequest({
      from: currentUser.data._id,
      to: user._id,
      status: 2,
    });

    const res = await api
      .get(`/api/users/${ user._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.relationshipStatus).toBe('accepted');
  });


  it('should return relationship status of \'rejected\' if there is a rejected request', async () => {
    // Seed a second user with a public profile
    const user = await seedUser({ isPrivate: 'false' });

    // Seed a rejected friend request
    await seedFriendRequest({
      from: currentUser.data._id,
      to: user._id,
      status: 3,
    });

    const res = await api
      .get(`/api/users/${ user._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.relationshipStatus).toBe('rejected');
  });


  it('should return relationship status of \'oneself\' if current user requests themselves', async () => {
    const res = await api
      .get(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.relationshipStatus).toBe('oneself');
  });


  it('should return relationship status of \'none\' if users are strangers', async () => {
    // Seed a second user with a public profile
    const user = await seedUser({ isPrivate: 'false' });

    const res = await api
      .get(`/api/users/${ user._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.relationshipStatus).toBe('none');
  });


  it('should remove vulnerable fields from response', async () => {
    // Seed a second user with a public profile
    const user = await seedUser({ isPrivate: 'false' });

    const res = await api
      .get(`/api/users/${ user._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
  });


  it('should populate some details about returned user\'s friends', async () => {
    let users = [];

    // Seed two more users
    for (let i = 0; i < 2; i++) {     
      const user = await seedUser({ isPrivate: 'false' });
      users.push(user);
    };

    // Give user two a friend
    users[0].friends.push(users[1]._id);
    await users[0].save();    

    // Fetch info for user two
    const res = await api
      .get(`/api/users/${ users[0]._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.friends[0]).toHaveProperty('fullName');
    expect(res.body.friends[0]).toHaveProperty('avatarUrl');
    expect(res.body.friends[0]).toHaveProperty('isPrivate');
    expect(res.body.friends[0]).toHaveProperty('friends');
  });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .get(`/api/users/${ invalidId }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if user doesn\'t exist', async () => {
    const res = await api
      .get(`/api/users/${ fakeIds[0] }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });
});

describe('PUT /api/users/:id', () => {
  const currentUser = createAuthedUser();

  describe('action=edit', () => {
    it('should update a single field', async () => {
      const data = {
        bio: faker.lorem.sentence(),
      };

      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', currentUser.cookie)
        .send(data);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('bio');
      expect(res.body.bio).toBe(data.bio);
    });


    it('should update all fields', async () => {
      const data = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        bio: faker.lorem.sentence(),
        location: faker.address.city(),
        hometown: faker.address.city(),
        occupation: faker.name.jobTitle(),
      };

      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', currentUser.cookie)
        .send(data);

      expect(res.statusCode).toBe(200);
      expect(res.body.firstName).toBe(data.firstName);
      expect(res.body.lastName).toBe(data.lastName);
      expect(res.body.bio).toBe(data.bio);
      expect(res.body.location).toBe(data.location);
      expect(res.body.hometown).toBe(data.hometown);
      expect(res.body.occupation).toBe(data.occupation);
    });


    it('should trim input data', async () => {
      const bio = faker.lorem.sentence();

      const data = {
        bio: ` ${ bio }`,
      };

      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', currentUser.cookie)
        .send(data);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('bio');
      expect(res.body.bio).toBe(bio);
    });


    it('should strip unknown fields from request body', async () => {
      const data = {
        bio: faker.lorem.sentence(),
        foo: 'bar',
      };

      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', currentUser.cookie)
        .send(data);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('bio');
      expect(res.body).not.toHaveProperty('foo');
    });


    it('should return 400 if no update data has been sent', async () => {
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('You must supply some data to update profile');
    });
  });

  describe('action=unfriend', () => {
    let friend;

    // Give current user a friend
    beforeEach(async () => {
      friend = await seedUser({
        friends: [currentUser.data._id],
      });

      currentUser.data.friends.push(friend._id);
      await currentUser.data.save();
    });

    it('should remove friend from user\'s friends list', async () => {
      // Remove friend
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: friend._id.toString() })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(200);

      // Find current user in database
      const currentUserDoc = await models.User.findById(currentUser.data._id).exec();

      expect(currentUserDoc.friends).not.toContain(friend._id);
    });


    it('should remove user from unfriended user\'s friends list', async () => {
      // Remove friend
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: friend._id.toString() })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(200);

      // Find friend in database
      const friendDoc = await models.User.findById(friend._id).exec();

      expect(friendDoc.friends).not.toContain(currentUser.data._id);
    });


    it('should remove corresponding friend request', async () => {
      // Seed an accepted friend request between current user and friend
      await seedFriendRequest({
        from: currentUser.data._id,
        to: friend._id,
        status: 2,
      });

      // Remove friend
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: friend._id.toString() })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(200);

      // Find friend request in database
      const friendRequestDoc = await models.FriendRequest.findOne({
        $or: [
          { from: currentUser.data._id, to: friend._id },
          { from: friend._id, to: currentUser.data._id },
        ],
      }).exec();

      expect(friendRequestDoc).toBeNull();
    });


    it('should return 400 if \'friendid\' is missing', async () => {
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'unfriend' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Friend ID is required');
    });


    it('should return 400 if \'friendid\' isn\'t a valid ObjectId', async () => {
      const invalidId = 'abc123';

      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: invalidId })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Friend ID must be a valid ObjectId');
    });


    it('should return 400 if \'friendid\' is an empty string', async () => {
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: '' })
        .set('Cookie', currentUser.cookie);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Friend ID must not be empty');
    });


    it('should return 400 if friend doesn\'t exist', async () => {
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: fakeIds[0] })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Friend doesn\'t exist');
    });


    it('should return 403 if user attempts to unfriend a user who isn\'t a friend', async () => {
      // Seed a user who isn't friends with current user
      const stranger = await seedUser();

      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: stranger._id.toString() })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You are not friends with this user');
    });
  });

  describe('action=logout', () => {    
    it('should mark user as offline', async () => {
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'logout' })
        .set('Cookie', currentUser.cookie);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.isOnline).toBeFalsy();
    });

  
    it('should update lastOnline value', async () => {
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'logout' })
        .set('Cookie', currentUser.cookie);   
        
      expect(res.statusCode).toBe(200);
      expect(res.body.lastOnline).toBeDefined();
    }); 
  });

  describe('action=upload', () => {
    it('should upload an avatar image', async () => {
      const avatarUrl = path.resolve(__dirname, '../images/test.jpg');

      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'upload' })
        .attach('avatar', avatarUrl)
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.avatarUrl).not.toContain('avatar.svg'); // This is the default image file

      // Remove file from uploads directory
      await fs.unlink(res.body.avatarUrl);
    });


    it('should upload a background image', async () => {
      const backgroundUrl = path.resolve(__dirname, '../images/test.jpg');

      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'upload'})
        .attach('background', backgroundUrl)
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.backgroundUrl).not.toContain('background.jpg'); // This is the default image file

      // Remove file from uploads directory
      await fs.unlink(res.body.backgroundUrl);
    });

    // Tests for image size, quantity, and format found
    // in the 'post' test suite
  });

  describe('action=change-visibility', () => {
    it('should toggle isPrivate value to false', async () => {
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'change-visibility' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.isPrivate).toBeFalsy();
    });


    it('should toggle isPrivate value to true', async () => {
      // Make current user's account public
      await models.User.findByIdAndUpdate(currentUser.data._id, {
        isPrivate: false,
      }).exec();

      // Make current user's account private again
      const res = await api
        .put(`/api/users/${ currentUser.data._id }`)
        .query({ action: 'change-visibility' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.isPrivate).toBeTruthy();
    });
  });

  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';
    
    const res = await api
      .put(`/api/users/${ invalidId }`)
      .query({ action: 'logout' })
      .set('Cookie', currentUser.cookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if user doesn\'t exist', async () => {
    const res = await api
      .put(`/api/users/${ fakeIds[0] }`)
      .query({ action: 'logout' })
      .set('Cookie', currentUser.cookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });


  it('should return 403 if \':id\' is not of current user', async () => {
    // Seed a stranger
    const stranger = await seedUser();

    const res = await api
      .put(`/api/users/${ stranger._id }`)
      .query({ action: 'logout' })
      .set('Cookie', currentUser.cookie);
      
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only update your own profile');
  });


  it('should return 400 if \'action\' is missing', async () => {
    const res = await api
      .put(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);
      
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Action is required');
  });


  it('should return 400 if \'action\' is not one of \'edit\', \'unfriend\', \'logout\', \'upload\', or \'change-visibility\'', async () => {
    const invalidAction = faker.word.verb();
    
    const res = await api
      .put(`/api/users/${ currentUser.data._id }`)
      .query({ action: invalidAction })
      .set('Cookie', currentUser.cookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Action must be one of \'edit\', \'unfriend\', \'logout\', \'upload\', or \'change-visibility\'');
  });
});

describe('DELETE /api/users/:id', () => {
  const currentUser = createAuthedUser();

  it('should remove user account', async () => {
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    const currentUserDoc = await models.User.findById(currentUser.data._id).exec();

    expect(currentUserDoc).toBeNull;
  });


  it('should remove associated post and its comment', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

    // Seed a comment
    const comment = await seedComment({
      postedBy: currentUser.data._id,
      postId: post._id,
    });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that user's post and its comment have been removed
    const postDoc = await models.Post.findById(post._id).exec();
    const commentDoc = await models.Comment.findById(comment._id).exec();

    expect(postDoc).toBeNull();
    expect(commentDoc).toBeNull();
  });


  it('should remove a friend request user has sent', async () => {
    // Seed a friend request
    const friendRequest = await seedFriendRequest({ from: currentUser.data._id });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that friend request has been removed
    const friendRequestDoc = await models.FriendRequest.findById(friendRequest._id).exec();

    expect(friendRequestDoc).toBeNull();
  });


  it('should remove friend request user has received', async () => {
    // Seed a friend request
    const friendRequest = await seedFriendRequest({ to: currentUser.data._id });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that friend request has been removed
    const friendRequestDoc = await models.FriendRequest.findById(friendRequest._id).exec();

    expect(friendRequestDoc).toBeNull();
  });


  it('should mark associated notification as deleted', async () => { 
    // Seed a notification
    const notification = await seedNotification({
      recipients: [currentUser.data._id, fakeIds[0]],
    });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that user has been added to deletedBy array
    const notificationDoc = await models.Notification.findById(notification._id).exec();

    expect(notificationDoc.deletedBy).toContainEqual(currentUser.data._id);
  });


  it('should remove associated notification if all recipients mark as deleted', async () => {
    // Seed a notification
    const notification = await seedNotification({
      recipients: [currentUser.data._id, fakeIds[0]],
      deletedBy: [fakeIds[0]],
    });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that notification has been removed
    const notificationDoc = await models.Notification.findById(notification._id).exec()

    expect(notificationDoc).toBeNull();
  });


  it('should remove user from friend\'s friends list', async () => {
    // Seed a second user who is friends with current user
    const friend = await seedUser({
      friends: [currentUser.data._id],
    });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that current user is no longer in friend's friends list
    const friendDoc = await models.User.findById(friend._id);

    expect(friendDoc.friends).not.toContainEqual(currentUser.data._id);
  });


  // it('should remove user\'s avatar from uploads', async () => {
  //   const avatarUrl = path.resolve(__dirname, '../images/test.jpg');

  //   // Add an avatar to user's profile
  //   const res = await api
  //     .put(`/api/users/${ currentUser.data._id }`)
  //     .query({ action: 'upload' })
  //     .attach('avatar', avatarUrl)
  //     .set('Cookie', currentUser.cookie);

  //   expect(res.statusCode).toBe(200);

  //   const uploadPath = res.body.avatarUrl; 

  //   // expect file to be in fs

  //   // Delete account
  //   const res2 = await api
  //     .delete(`/api/users/${ currentUser.data._id }`)
  //     .set('Cookie', currentUser.cookie);

  //   expect(res2.statusCode).toBe(204);
  //   // expect file to not be in fs
  // });


  // it('should remove user\'s background image from uploads', async () => {
  //   // TODO
  // });


  it('should remove user\'s like from another user\'s post', async () => {
    // Seed a post, liked by current user who will be deleted
    const post = await seedPost({
      likedBy: [currentUser.data._id],
    });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that user's like has been removed
    const postDoc = await models.Post.findById(post._id).exec();

    expect(postDoc.likedBy).not.toContainEqual(currentUser.data._id);
  });


  it('should remove user\'s like from another user\'s comment', async () => {
    // Seed a comment, liked by current user who will be deleted
    const comment = await seedComment({
      likedBy: [currentUser.data._id],
    });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that user's like has been removed
    const commentDoc = await models.Comment.findById(comment._id).exec();

    expect(commentDoc.likedBy).not.toContainEqual(currentUser.data._id);
  });


  it('should remove user from associated conversations and inform remaining member/s', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
    });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that conversation no longer includes current user
    const conversationDoc = await models.Conversation.findById(conversation._id).exec();

    expect(conversationDoc.members).not.toContainEqual(currentUser.data._id);

    // Verify that there is a notification message in database
    const messageDoc = await models.Message.findOne({
      conversationId: conversation._id,
      type: 'notification',
    }).exec();

    expect(messageDoc.content).toBe(`${ currentUser.data.fullName } is no longer available to chat.`);
  });


  it('should assign a new admin and inform remaining member/s if user is current group admin', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a group conversation with current user as admin
    const conversation = await seedConversation({
      type: 'group',
      admin: currentUser.data._id,
      members: [currentUser.data._id, user._id],
    });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that current user is no longer part of conversation,
    // and that there is a new admin
    const conversationDoc = await models.Conversation.findById(conversation._id).exec();

    expect(conversationDoc.members).not.toContainEqual(currentUser.data._id);
    expect(conversationDoc.admin).toEqual(user._id);

    // Verify that there is a notification message in the database
    const messageDoc = await models.Message.findOne({
      conversationId: conversation._id,
      type: 'notification',
    }).exec();

    expect(messageDoc.content).toContain(`${ user.fullName } is the new admin.`);
  });


  it('should remove conversation and its messages if all members mark as deleted', async () => {
    // Seed a conversation marked as deleted by one member
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
      deletedBy: [fakeIds[0]],
    });

    // Seed a message
    await seedMessage({
      sender: currentUser.data._id,
      conversationId: conversation._id,
      readBy: [fakeIds[0]],
      deletedBy: [fakeIds[0]],
    });

    // Delete account
    const res = await api
      .delete(`/api/users/${ currentUser.data._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that conversation has been removed
    const conversationDoc = await models.Conversation.findById(conversation._id).exec();

    expect(conversationDoc).toBeNull();

    // Verify that associated messages have been removed
    const messageDocs = await models.Message.find({ conversationId: conversation._id }).exec();

    expect(messageDocs).toHaveLength(0);
  });


  // it('should mark associated messages as read and deleted', async () => {

  // });


  // it('should remove associated messages if all members mark as deleted', async () => {

  // });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .delete(`/api/users/${ invalidId }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if user doesn\'t exist', async () => {
    const res = await api
      .delete(`/api/users/${ fakeIds[0] }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });


  it('should return 403 if \':id\' is not of current user', async () => {
    // Seed a stranger
    const stranger = await seedUser();

    const res = await api
      .delete(`/api/users/${ stranger._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only delete your own record');
  });
});
