const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../../src/app');
const dbUtil = require('../../utils/db.util');
const data = require('../data/index.data');
const models = require('../../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/users/:id', () => {
  let users = [];

  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 4; i++) {
      const _user = new models.User(data.users[i]);
      await _user.save();
      
      users.push({ data: _user });
    }
  });

  // Authenticate users
  beforeEach(async () => {
    for (let i = 0; i < 4; i++) {
      const userInfo = {
        email: data.users[i].email,
        password: data.users[i].password,
      };

      const res = await api
        .post('/api/auth/email')
        .send(userInfo);

      users[i].cookie = res.headers['set-cookie'][0];
    }
  });

  // Clear array after each test
  afterEach(() => users = []);

  it('should fetch another user\'s profile information', async () => {
    // Add custom info to user two's profile
    await models.User.findByIdAndUpdate(
      users[1].data._id,
      { occupation: faker.word.noun(), bio: faker.lorem.sentence() },
    ).exec();

    const res = await api
      .get(`/api/users/${ users[1].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('firstName');
    expect(res.body).toHaveProperty('occupation');
    expect(res.body).toHaveProperty('bio')
    expect(res.body).toHaveProperty('friends');
  });


  it('should remove vulnerable fields from response', async () => {
    const res = await api
      .get(`/api/users/${ users[1].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
  });


  it('should populate some details about returned user\'s friends', async () => {
    // Add friend to user two's profile
    await models.User.findByIdAndUpdate(
      users[1].data._id,
      { $push: { friends: users[2].data._id }},
    ).exec();

    // Add friend to user three's profile
    await models.User.findByIdAndUpdate(
      users[2].data._id,
      { $push: { friends: users[3].data._id }}
    ).exec();

    // Fetch info for friend (user two)
    const res = await api
      .get(`/api/users/${ users[1].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.friends[0]).toHaveProperty('firstName');
    expect(res.body.friends[0]).toHaveProperty('lastName');
    expect(res.body.friends[0]).toHaveProperty('avatarUrl');
    expect(res.body.friends[0]).toHaveProperty('friends');

    // Deeper friendships shouldn't be populated, just ObjectIds (stringified here)
    expect(res.body.friends[0].friends[0]).toBe(users[3].data._id.toString());
  });


  it('should return 400 if :id param is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .get(`/api/users/${ invalidId }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(':id must be a valid ObjectId');
  });


  it('should return 400 if user doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .get(`/api/users/${ fakeId }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });
});

describe('PUT /api/users/:id', () => {
  let users = [];

  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 4; i++) {
      const _user = new models.User(data.users[i]);
      await _user.save();
      
      users.push({ data: _user });
    }
  });

  // Authenticate users
  beforeEach(async () => {
    for (let i = 0; i < 3; i++) {
      const userInfo = {
        email: data.users[i].email,
        password: data.users[i].password,
      };

      const res = await api
        .post('/api/auth/email')
        .send(userInfo);

      users[i].cookie = res.headers['set-cookie'][0];
    }
  });

  // Clear array after each test
  afterEach(() => users = []);

  describe('action=edit', () => {
    it('should update a single field', async () => {
      const data = {
        bio: faker.lorem.sentence(),
      };

      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', users[0].cookie)
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
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', users[0].cookie)
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
      const bioWithoutWhitespace = faker.lorem.sentence();

      const data = {
        bio: ` ${ bioWithoutWhitespace }`,
      };

      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', users[0].cookie)
        .send(data);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('bio');
      expect(res.body.bio).toBe(bioWithoutWhitespace);
    });


    it('should strip unknown fields from request body', async () => {
      const data = {
        bio: faker.lorem.sentence(),
        foo: 'bar',
      };

      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', users[0].cookie)
        .send(data);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('bio');
      expect(res.body).not.toHaveProperty('foo');
    });


    it('should return 400 if no update data has been sent', async () => {
      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'edit' })
        .set('Cookie', users[0].cookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('You must supply some data to update profile');
    });
  });

  describe('action=unfriend', () => {
    // Add eachother as friends
    beforeEach(async () => {
      await models.User.findByIdAndUpdate(
        users[0].data._id,
        { $push: { friends: users[1].data._id }}
      ).exec();

      await models.User.findByIdAndUpdate(
        users[1].data._id,
        { $push: { friends: users[0].data._id }}
      ).exec();
    });

    it('should remove friend from user\'s friends list', async () => {
      // Remove friend
      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: users[1].data._id.toString() })
        .set('Cookie', users[0].cookie);

      expect(res.statusCode).toBe(200);

      // Find user in database
      const user = await models.User.findById(users[0].data._id).exec();

      expect(user.friends).not.toContain(users[1].data._id);
    });


    it('should remove user from unfriended user\'s friends list', async () => {
      // Remove friend
      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: users[1].data._id.toString() })
        .set('Cookie', users[0].cookie);

      expect(res.statusCode).toBe(200);

      // Find friend in database
      const friend = await models.User.findById(users[1].data._id).exec();

      expect(friend.friends).not.toContain(users[0].data._id);
    });


    it('should remove corresponding friend request', async () => {
      // Remove friend
      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: users[1].data._id.toString() })
        .set('Cookie', users[0].cookie);

      expect(res.statusCode).toBe(200);

      // Find friend request in database
      const friendRequest = await models.FriendRequest.findOne({
        $or: [
          { from: users[0].data._id, to: users[1].data._id },
          { from: users[1].data._id, to: users[0].data._id },
        ],
      }).exec();

      expect(friendRequest).toBeNull();
    });


    it('should return 400 if friendid query parameter is missing', async () => {
      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'unfriend' })
        .set('Cookie', users[0].cookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('friendid is required');
    });


    it('should return 400 if friendid isn\'t a valid ObjectId', async () => {
      const invalidId = 'abc123';

      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: invalidId })
        .set('Cookie', users[0].cookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('friendid must be a valid ObjectId');
    });


    it('should return 400 if friend doesn\'t exist', async () => {
      const fakeId = '62c7cb5fc583794ebd47f3ab';
      
      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: fakeId })
        .set('Cookie', users[0].cookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Friend doesn\'t exist');
    });


    it('should return 403 if user attempts to unfriend a user who isn\'t a friend', async () => {
      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'unfriend' })
        .query({ friendid: users[2].data._id.toString() })
        .set('Cookie', users[0].cookie);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You are not friends with this user');
    });
  });

  describe('action=logout', () => {    
    it('should mark user as offline', async () => {
      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'logout' })
        .set('Cookie', users[0].cookie);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.isOnline).toBeFalsy();
    });

  
    it('should update lastOnline value', async () => {
      const res = await api
        .put(`/api/users/${ users[0].data._id }`)
        .query({ action: 'logout' })
        .set('Cookie', users[0].cookie);   
        
      expect(res.statusCode).toBe(200);
      expect(res.body.lastOnline).toBeDefined();
    }); 
  });

  it('should return 400 if :id param is invalid', async () => {
    const invalidId = 'abc123';
    
    const res = await api
      .put(`/api/users/${ invalidId }`)
      .query({ action: 'logout' })
      .set('Cookie', users[0].cookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(':id must be a valid ObjectId');
  });


  it('should return 400 if user doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';
    
    const res = await api
      .put(`/api/users/${ fakeId }`)
      .query({ action: 'logout' })
      .set('Cookie', users[0].cookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });


  it('should return 403 if :id is not of current user', async () => {
    const res = await api
      .put(`/api/users/${ users[0].data._id }`)
      .query({ action: 'logout' })
      .set('Cookie', users[1].cookie);
      
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only update your own profile');
  });


  it('should return 400 if action query parameter is missing', async () => {
    const res = await api
      .put(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);
      
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('action is required');
  });


  it('should return 400 if action is not one of \'edit\', \'unfriend\', or \'logout\'', async () => {
    const invalidAction = faker.word.verb();
    
    const res = await api
      .put(`/api/users/${ users[0].data._id }`)
      .query({ action: invalidAction })
      .set('Cookie', users[0].cookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('action must be one of \'edit\', \'unfriend\', or \'logout\'');
  });
});

describe('DELETE /api/users/:id', () => {
  let users = [];

  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 3; i++) {
      const _user = new models.User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }
  });
  
  // Authenticate users
  beforeEach(async () => {
    for (let i = 0; i < 3; i++) {
      const userInfo = {
        email: data.users[i].email,
        password: data.users[i].password,
      };
      
      const res = await api
        .post('/api/auth/email')
        .send(userInfo);

      users[i].cookie = res.headers['set-cookie'][0];
    }
  });

  // Clear array after each test
  afterEach(() => users = []);

  it('should remove user account', async () => {
    const res = await api
      .delete(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    const user = await models.User.findById(users[0].data._id).exec();

    expect(user).toBeNull;
  });


  it('should remove associated post and its comment', async () => {
    // Seed a post
    const post = new models.Post({
      postedBy: users[0].data._id,
      content: data.posts[0].content,
    });

    await post.save();

    // Seed a comment
    const comment = new models.Comment({
      postedBy: users[1].data._id,
      postId: post._id,
      content: data.comments[0].content,
    });

    await comment.save();

    // Delete account
    const res = await api
      .delete(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    // Verify that user's post and its comment have been removed
    const returnedPost = await models.Post.findById(post._id).exec();
    const returnedComment = await models.Comment.findById(comment._id).exec();

    expect(returnedPost).toBeNull();
    expect(returnedComment).toBeNull();
  });


  it('should remove friend request user has sent', async () => {
    // Seed a friend request
    const friendRequest = new models.FriendRequest({
      from: users[0].data._id,
      to: users[1].data._id,
    });

    await friendRequest.save();

    // Delete account
    const res = await api
      .delete(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    // Verify that friend request has been removed
    const returnedFriendRequest = await models.FriendRequest.findById(friendRequest._id).exec();

    expect(returnedFriendRequest).toBeNull;
  });


  it('should remove friend request user has received', async () => {
    // Seed a friend request
    const friendRequest = new models.FriendRequest({
      from: users[1].data._id,
      to: users[0].data._id,
    });

    await friendRequest.save();

    // Delete account
    const res = await api
      .delete(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    // Verify that friend request has been removed
    const returnedFriendRequest = await models.FriendRequest.findById(friendRequest._id).exec();

    expect(returnedFriendRequest).toBeNull();
  });


  it('should mark associated notification as deleted', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    // Seed a notification
    const notification = new models.Notification({
      actor: users[2].data._id,
      recipients: [users[0].data._id, users[1].data._id],
      actionType: 1,
      actionSource: fakeId,
    });

    await notification.save();

    // Delete account
    const res = await api
      .delete(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    // Verify that user has been added to deletedBy array
    const returnedNotification = await models.Notification.findById(notification._id).exec();

    expect(returnedNotification.deletedBy).toContainEqual(users[0].data._id);
  });


  it('should remove associated notification if all recipients mark as deleted', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    // Seed a notification
    const notification = new models.Notification({
      actor: users[2].data._id,
      recipients: [users[0].data._id, users[1].data._id],
      actionType: 1,
      actionSource: fakeId,
      deletedBy: [users[1].data._id],
    });

    await notification.save();

    // Delete account
    const res = await api
      .delete(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    // Verify that notification has been removed
    const returnedNotification = await models.Notification.findById(notification._id).exec()

    expect(returnedNotification).toBeNull();
  });


  it('should remove user from friend\'s friends list', async () => {
    // Add user one to user two's friends list
    await models.User.findByIdAndUpdate(
      users[1].data._id,
      { $push: { friends: users[0].data._id }},
    ).exec();

    // Delete account
    const res = await api
      .delete(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    // Verify that user one is no longer in user two's friends list
    const user = await models.User.findById(users[1].data._id);

    expect(user.friends).not.toContainEqual(users[0].data._id);
  });


  it('should remove user\'s avatar from uploads', async () => {
    // Add an avatar to user's profile
  });


  it('should remove user\'s background image from uploads', async () => {
    // TODO
  });


  it('should remove user\'s like from another user\'s post', async () => {
    // Seed a post, liked by user that will be deleted
    const post = new models.Post({
      postedBy: users[1].data._id,
      content: data.posts[0].content,
      likedBy: [users[0].data._id],
    });

    await post.save();

    // Delete account
    const res = await api
      .delete(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    // Verify that user's like has been removed
    const returnedPost = await models.Post.findById(post._id).exec();

    expect(returnedPost.likedBy).not.toContainEqual(users[0].data._id);
  });


  it('should remove user\'s like from another user\'s comment', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    // Seed a comment, liked by user that will be deleted
    const comment = new models.Comment({
      postedBy: users[1].data._id,
      postId: fakeId,
      content: data.comments[0].content,
      likedBy: [users[0].data._id],
    });

    await comment.save();

    // Delete account
    const res = await api
      .delete(`/api/users/${ users[0].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    // Verify that user's like has been removed
    const returnedComment = await models.Comment.findById(comment._id).exec();

    expect(returnedComment.likedBy).not.toContainEqual(users[0].data._id);
  });


  it('should return 400 if :id param is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .delete(`/api/users/${ invalidId }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(':id must be a valid ObjectId');
  });


  it('should return 400 if user doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .delete(`/api/users/${ fakeId }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });


  it('should return 403 if :id is not of current user', async () => {
    const res = await api
      .delete(`/api/users/${ users[1].data._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only delete your own record');
  });
});
