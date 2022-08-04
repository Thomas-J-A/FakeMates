const supertest = require('supertest');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const models = require('../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

const fakeUserId = new mongoose.Types.ObjectId().toString();
const anotherFakeUserId = new mongoose.Types.ObjectId().toString();
const fakeFriendRequestId = new mongoose.Types.ObjectId().toString();

describe('GET /api/friend-requests', () => {
  const currentUser = createAuthedUser();

  it('should fetch all pending friend requests', async () => {
    // Seed friend requests
    for (let i = 0; i < 2; i++) {
      const friendRequest = new models.FriendRequest({
        from: i % 2 === 0 ? fakeUserId: anotherFakeUserId,
        to: currentUser.data._id,
      });

      await friendRequest.save();
    }

    // Fetch friend requests
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);

    // Verify that all returned friend requests are in a pending state
    res.body.forEach((fr) => {
      // 1=Pending, 2=Accepted, 3=Rejected
      expect(fr.status).toBe(1);
    });
  });


  it('should populate some details about requester', async () => {
    // Seed a second user
    const user = new models.User({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    });

    await user.save();

    // Seed a friend request
    const friendRequest = new models.FriendRequest({
      from: user._id,
      to: currentUser.data._id,
    });

    await friendRequest.save();

    // Fetch friend requests
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body[0].from).toHaveProperty('fullName');
    expect(res.body[0].from).toHaveProperty('avatarUrl');
    expect(res.body[0].from).not.toHaveProperty('email');
    expect(res.body[0].from).not.toHaveProperty('location');
  });


  it('should return valid response if there are no pending requests', async () => {
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });


  it('should not return any accepted requests', async () => {
    // Seed an accepted friend request
    const friendRequest = new models.FriendRequest({
      from: fakeUserId,
      to: currentUser.data._id,
      status: 2,
    });

    await friendRequest.save();

    // Fetch all pending requests
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });


  it('should not return any rejected requests', async () => {
    // Seed a rejected friend request
    const friendRequest = new models.FriendRequest({
      from: fakeUserId,
      to: currentUser.data._id,
      status: 3,
    });

    await friendRequest.save();

    // Fetch all pending requests
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('POST /api/friend-request', () => {
  const currentUser = createAuthedUser();
  
  // Seed a second user
  let user;

  beforeEach(async () => {
    user = new models.User({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    });
    
    await user.save();
  })

  it('should create a friend request', async () => {
    const res = await api
      .post('/api/friend-requests')
      .query({ to: user._id.toString() })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(201);
    expect(res.body.from).toBe(currentUser.data._id.toString());
    expect(res.body.to).toBe(user._id.toString());
  });


  it('should return 400 if \'to\' is missing', async () => {
    const res = await api
      .post('/api/friend-requests')
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Recipient is required');
  });


  it('should return 400 if \'to\' isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123';

    const res = await api
      .post('/api/friend-requests')
      .query({ to: invalidId })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Recipient must be a valid ObjectId');
  });


  it('should return 400 if \'to\' is an empty string', async () => {
    const res = await api
      .post('/api/friend-requests')
      .query({ to: '' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Recipient must not be empty');
  });


  it('should return 403 if user attempts to send a friend request to themselves', async () => {
    const res = await api
      .post('/api/friend-requests')
      .query({ to: currentUser.data._id.toString() })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You cannot send a friend request to yourself');
  });


  it('should return 400 if user doesn\'t exist', async () => {
    const res = await api
      .post('/api/friend-requests')
      .query({ to: fakeUserId })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });


  it('should return 403 if there is already a pending request - user one as original requester', async () => {
    // Seed a pending friend request
    const friendRequest = new models.FriendRequest({
      from: currentUser.data._id,
      to: user._id,
    });

    await friendRequest.save();

    // Send a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: user._id.toString() })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('A friend request is already pending');
  });

  
  it('should return 403 if there is already a pending request - user two as original requester', async () => {
    // Seed a pending friend request
    const friendRequest = new models.FriendRequest({
      from: user._id,
      to: currentUser.data._id,
    });

    await friendRequest.save();

    // Send a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: user._id.toString() })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('A friend request is already pending');
  });


  it('should return 403 if the users are already friends - user one as original requester', async () => {
    // Seed a friend request where users are already friends
    const friendRequest = new models.FriendRequest({
      from: currentUser.data._id,
      to: user._id,
      status: 2,
    });

    await friendRequest.save();

    // Send a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: user._id.toString() })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are already friends with this user');
  });


  it('should return 403 if the users are already friends - user two as original requester', async () => {
    // Seed a friend request where users are already friends
    const friendRequest = new models.FriendRequest({
      from: user._id,
      to: currentUser.data._id,
      status: 2,
    });

    await friendRequest.save();

    // Send a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: user._id.toString() })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are already friends with this user');
  });


  it('should return 403 if a friend request has previously been rejected - user one as original requester', async () => {
    // Seed a rejected friend request
    const friendRequest = new models.FriendRequest({
      from: currentUser.data._id,
      to: user._id,
      status: 3,
    });

    await friendRequest.save();

    // Seed a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: user._id.toString() })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('This friendship has already been rejected');
  });


  it('should return 403 if a friend request has previously been rejected - user two as original requester', async () => {
    // Seed a rejected friend request
    const friendRequest = new models.FriendRequest({
      from: user._id,
      to: currentUser.data._id,
      status: 3,
    });

    await friendRequest.save();

    // Send a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: user._id.toString() })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('This friendship has already been rejected');
  });
});

describe('PUT /api/friend-request/:id', () => {
  const currentUser = createAuthedUser();
  
  // Seed a second user and friend request
  // (done in a beforeEach to keep code DRY although there is some slight redundancy)
  let user;
  let friendRequest;
  
  beforeEach(async () => {
    user = new models.User({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    });

    await user.save();

    friendRequest = new models.FriendRequest({
      from: user._id,
      to: currentUser.data._id,
    });

    await friendRequest.save();
  })

  it('should accept a friend request', async () => {
    const res = await api
      .put(`/api/friend-requests/${ friendRequest._id }`)
      .query({ accept: true })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.friends).toContain(user._id.toString());
  });


  it('should add recipient to requesters\'s friends list if accepted', async () => {
    await api
      .put(`/api/friend-requests/${ friendRequest._id }`)
      .query({ accept: true })
      .set('Cookie', currentUser.cookie);

    // Verify that recipient is in requester's friends list
    const userDoc = await models.User.findById(user._id);
    
    // Friends array contains ObjectIds since it comes straight from database
    // and these are objects rather than primitive data types, hence toContainEqual
    expect(userDoc.friends).toContainEqual(currentUser.data._id);
  });


  it('should reject a friend request', async () => {
    const res = await api
      .put(`/api/friend-requests/${ friendRequest._id }`)
      .query({ accept: false })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);
  });


  it('should change status of friend request to 2 (accepted)', async () => {
    // Accept friend request
    await api
      .put(`/api/friend-requests/${ friendRequest._id }`)
      .query({ accept: true })
      .set('Cookie', currentUser.cookie);

    // Verify friend request status
    const friendRequestDoc = await models.FriendRequest.findById(friendRequest._id);

    expect(friendRequestDoc.status).toBe(2);
  });


  it('should change status of friend request to 3 (rejected)', async () => {
    // Reject friend request
    await api
      .put(`/api/friend-requests/${ friendRequest._id }`)
      .query({ accept: false })
      .set('Cookie', currentUser.cookie);

    // Verify friend request status
    const friendRequestDoc = await models.FriendRequest.findById(friendRequest._id);

    expect(friendRequestDoc.status).toBe(3);
  });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .put(`/api/friend-requests/${ invalidId }`)
      .query({ accept: true })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if \'accept\' is missing', async () => {
    const res = await api
      .put(`/api/friend-requests/${ fakeFriendRequestId }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Accept is required');
  });


  it('should return 400 if \'accept\' is not a Boolean', async () => {
    const accept = faker.word.noun();

    const res = await api
      .put(`/api/friend-requests/${ fakeFriendRequestId }`)
      .query({ accept })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Accept must be a Boolean value');
  });


  it('should return 400 if friend request doesn\'t exist', async () => {
    const res = await api
      .put(`/api/friend-requests/${ fakeFriendRequestId }`)
      .query({ accept: true })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Friend request doesn\'t exist');
  });


  it('should return 403 if current user is not the recipient of friend request', async () => {
    // Seed and authenticate a third user
    let stranger = {};

    stranger.data = new models.User({
      firstName: 'Musonius',
      lastName: 'Rufus',
      email: 'rufo@gmail.com',
      password: 'password',
    });
  
    await stranger.data.save();
    
    const res = await api
      .post('/api/auth/email')
      .send({
        email: 'rufo@gmail.com',
        password: 'password',
      });

    stranger.cookie = res.headers['set-cookie'][0];

    // Attempt to handle request with stranger
    const res2 = await api
      .put(`/api/friend-requests/${ friendRequest._id }`)
      .query({ accept: true })
      .set('Cookie', stranger.cookie);

    expect(res2.statusCode).toBe(403);
    expect(res2.body.message).toBe('Only the recipient can handle this friend request');
  });
});
