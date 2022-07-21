const supertest = require('supertest');

const app = require('../../../src/app');
const dbUtil = require('../../utils/db.util');
const seeds = require('../seeds/friend-request.seed');
const data = require('../data/index.data');
const User = require('../../../src/models/user.model');
const FriendRequest = require('../../../src/models/friend-request.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/friend-requests', () => {
  // Seed database
  const { users, friendRequests } = seeds.fetchFriendRequests();

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

  // Clear arrays after each test
  afterEach(() => {
    users.length = 0;
    friendRequests.length = 0;
  });

  it('should fetch all pending friend requests', async () => {
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);

    res.body.forEach((fr) => {
      // 1=Pending, 2=Accepted, 3=Rejected
      expect(fr.status).toBe(1);
    });
  });


  it('should populate some details about requester', async () => {
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body[0].from).toHaveProperty('firstName');
    expect(res.body[0].from).toHaveProperty('lastName');
    expect(res.body[0].from).toHaveProperty('avatarUrl');
    expect(res.body[0].from).not.toHaveProperty('email');
    expect(res.body[0].from).not.toHaveProperty('location');
  });


  it('should return valid response if there are no pending requests', async () => {
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });


  it('should not return any accepted requests', async () => {
    // Accept friend request
    await api
      .put(`/api/friend-requests/${ friendRequests[0]._id }`)
      .query({ accept: true })
      .set('Cookie', users[0].cookie);

    // Fetch all pending requests
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).not.toBe(friendRequests[0]._id.toString());
  });


  it('should not return any rejected requests', async () => {
    // Reject friend request
    await api
      .put(`/api/friend-requests/${ friendRequests[0]._id }`)
      .query({ accept: false })
      .set('Cookie', users[0].cookie);

    // Fetch all pending requests
    const res = await api
      .get('/api/friend-requests')
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).not.toBe(friendRequests[0]._id.toString());
  });
});

describe('POST /api/friend-request', () => {
  // Seed database
  const users = seeds.sendFriendRequest();

  // Authenticate users
  beforeEach(async () => {
    for (let i = 0; i < 2; i++) {
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
  afterEach(() => users.length = 0);

  it('should create a friend request', async () => {
    const res = await api
      .post('/api/friend-requests')
      .query({ to: users[1].data._id.toString() })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(201);
    expect(res.body.from).toBe(users[0].data._id.toString());
    expect(res.body.to).toBe(users[1].data._id.toString());
  });


  it('should return 400 if \'to\' query parameter is missing', async () => {
    const res = await api
      .post('/api/friend-requests')
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('to is required');
  });


  it('should return 400 if \'to\' query parameter isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123';

    const res = await api
      .post('/api/friend-requests')
      .query({ to: invalidId })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('to must be a valid ObjectId');
  });


  it('should return 403 if user attempts to send a friend request to themselves', async () => {
    const res = await api
      .post('/api/friend-requests')
      .query({ to: users[0].data._id.toString() })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You cannot send a friend request to yourself');
  });


  it('should return 400 if user doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .post('/api/friend-requests')
      .query({ to: fakeId })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });


  it('should return 403 if there is already a pending request - user one initiating', async () => {
    // Seed a friend request
    const _friendRequest = new FriendRequest({
      from: users[0].data._id,
      to: users[1].data._id,
    });

    await _friendRequest.save();

    // User one sends a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: users[1].data._id.toString() })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('A friend request is already pending');
  });

  
  it('should return 403 if there is already a pending request - user two initiating', async () => {
    // Seed a friend request
    const _friendRequest = new FriendRequest({
      from: users[0].data._id,
      to: users[1].data._id,
    });

    await _friendRequest.save();

    // User two sends a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: users[0].data._id.toString() })
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('A friend request is already pending');
  });


  it('should return 403 if the users are already friends - user one initiating', async () => {
    // Seed a friend request
    const _friendRequest = new FriendRequest({
      from: users[0].data._id,
      to: users[1].data._id,
      status: 2,
    });

    await _friendRequest.save();

    // User one sends a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: users[1].data._id.toString() })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are already friends with this user');
  });


  it('should return 403 if the users are already friends - user two initiating', async () => {
    // Seed a friend request
    const _friendRequest = new FriendRequest({
      from: users[0].data._id,
      to: users[1].data._id,
      status: 2,
    });

    await _friendRequest.save();

    // User two sends a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: users[0].data._id.toString() })
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are already friends with this user');
  });


  it('should return 403 if a friend request has previously been rejected - user one initiating', async () => {
    // Seed a database
    const _friendRequest = new FriendRequest({
      from: users[0].data._id,
      to: users[1].data._id,
      status: 3,
    });

    await _friendRequest.save();

    // User one sends a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: users[1].data._id.toString() })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('This friendship has already been rejected');
  });


  it('should return 403 if a friend request has previously been rejected - user two initiating', async () => {
    // Seed a database
    const _friendRequest = new FriendRequest({
      from: users[0].data._id,
      to: users[1].data._id,
      status: 3,
    });

    await _friendRequest.save();

    // User two sends a friend request
    const res = await api
      .post('/api/friend-requests')
      .query({ to: users[0].data._id.toString() })
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('This friendship has already been rejected');
  });
});

describe('PUT /api/friend-request/:id', () => {
  // Seed database
  const { users, friendRequests } = seeds.handleFriendRequest();

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

  // Clear arrays after each test
  afterEach(() => {
    users.length = 0;
    friendRequests.length = 0;
  });

  it('should accept a friend request', async () => {
    const res = await api
      .put(`/api/friend-requests/${ friendRequests[0]._id }`)
      .query({ accept: true })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.friends).toContain(users[1].data._id.toString());
  });


  it('should add recipient to requesters\'s friends list if accepted', async () => {
    // Accept friend request
    await api
      .put(`/api/friend-requests/${ friendRequests[0]._id }`)
      .query({ accept: true })
      .set('Cookie', users[0].cookie);

    // Verify that recipient is in requester's friends list
    const requester = await User.findById(users[1].data._id);
    
    // Friends array contains ObjectIds since it comes straight from database
    // and these are objects rather than primitive data types, hence toContainEqual
    expect(requester.friends).toContainEqual(users[0].data._id);
  });


  it('should reject a friend request', async () => {
    const res = await api
      .put(`/api/friend-requests/${ friendRequests[0]._id }`)
      .query({ accept: false })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);
  });


  it('should change status of friend request to 2 (accepted)', async () => {
     // Accept friend request
     await api
      .put(`/api/friend-requests/${ friendRequests[0]._id }`)
      .query({ accept: true })
      .set('Cookie', users[0].cookie);

    // Verify friend request status
    const friendRequest = await FriendRequest.findById(friendRequests[0]._id);

    expect(friendRequest.status).toBe(2);
  });


  it('should change status of friend request to 3 (rejected)', async () => {
    // Reject friend request
    await api
      .put(`/api/friend-requests/${ friendRequests[0]._id }`)
      .query({ accept: false })
      .set('Cookie', users[0].cookie);

    // Verify friend request status
    const friendRequest = await FriendRequest.findById(friendRequests[0]._id);

    expect(friendRequest.status).toBe(3);
  });


  it('should return 400 if :id param is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .put(`/api/friend-requests/${ invalidId }`)
      .query({ accept: true })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(':id must be a valid ObjectId');
  });


  it('should return 400 if accept query parameter is missing', async () => {
    const res = await api
      .put(`/api/friend-requests/${ friendRequests[0]._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('accept is required');
  });


  it('should return 400 if accept query parameter is not a Boolean', async () => {
    const res = await api
      .put(`/api/friend-requests/${ friendRequests[0]._id }`)
      .query({ accept: 'horse' })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('accept must be a Boolean value');
  });


  it('should return 400 if friend request doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .put(`/api/friend-requests/${ fakeId }`)
      .query({ accept: true })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Friend request doesn\'t exist');
  });


  it('should return 403 if current user is not the recipient of friend request', async () => {
    // Seed a friend request involving users 2 and 3
    const _friendRequest = new FriendRequest({
      from: users[2].data._id,
      to: users[1].data._id,
    });

    await _friendRequest.save();

    // Attempt to handle request with user 1
    const res = await api
      .put(`/api/friend-requests/${ _friendRequest._id }`)
      .query({ accept: true })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Only the recipient can handle this friend request');
  });
});
