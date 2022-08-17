 const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedUser, seedConversation, seedMessage } = require('../utils/seeds.util');
const fakeIds = require('../utils/fakeIds.util');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/messages', () => {
  const currentUser = createAuthedUser();

  it('should paginate results and let client know if there are more', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
    });

    // Seed enough messages for two pages
    for (let i = 0; i < 22; i++) {
      const message = await seedMessage({
        sender: i % 2 === 0 ? currentUser.data._id : fakeIds[0], // Simulate a conversation
        conversationId: conversation._id,
      });
    }

    // Fetch page one
    const res = await api
      .get('/api/messages')
      .query({ conversationId: conversation._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.messages).toHaveLength(20);
    expect(res.body.hasMore).toBeTruthy();

    // Fetch page two
    const res2 = await api
      .get('/api/messages')
      .query({ conversationId: conversation._id.toString() })
      .query({ page: 2 })
      .set('Cookie', currentUser.cookie);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.messages).toHaveLength(2);
    expect(res2.body.hasMore).toBeFalsy();
  });


  it('should return valid response if no messages are available', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
    });

    // Fetch messages
    const res = await api
      .get('/api/messages')
      .query({ conversationId: conversation._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.messages).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should populate some details of the sender field in a group conversation', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a group conversation
    const conversation = await seedConversation({
      type: 'group',
      members: [currentUser.data._id, user._id, fakeIds[0]],
    });

    // Seed a message
    await seedMessage({
      sender: user._id,
      conversationId: conversation._id,
    });

    // Fetch messages
    const res = await api
      .get('/api/messages')
      .query({ conversationId: conversation._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.messages[0]).toHaveProperty('sender');
    expect(res.body.messages[0].sender).toHaveProperty('fullName');
    expect(res.body.messages[0].sender).toHaveProperty('avatarUrl');
    expect(res.body.messages[0].sender).not.toHaveProperty('email');
    expect(res.body.messages[0].sender).not.toHaveProperty('location');
  });


  it('should not populate sender field in a private conversation', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a private conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
    });

    // Seed a message
    await seedMessage({
      sender: user._id,
      conversationId: conversation._id,
    });

    // Fetch messages
    const res = await api
      .get('/api/messages')
      .query({ conversationId: conversation._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.messages[0]).toHaveProperty('sender');
    expect(res.body.messages[0].sender).not.toHaveProperty('fullName');
    expect(res.body.messages[0].sender).not.toHaveProperty('avatarUrl');
  });


  it('should not return messages which are marked as deleted for current user', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
    });

    // Seed a message marked as read and deleted for current user
    await seedMessage({
      sender: currentUser.data._id,
      conversationId: conversation._id,
      readBy: [currentUser.data._id],
      deletedBy: [currentUser.data._id],
    });

    // Fetch messages
    const res = await api
      .get('/api/messages')
      .query({ conversationId: conversation._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.messages).toHaveLength(0);
  });


  it('should return 400 if conversation doesn\'t exist', async () => {
    const res = await api
      .get('/api/messages')
      .query({ conversationId: fakeIds[0] })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation doesn\'t exist');
  });


  it('should return 403 if user is not a member of the conversation', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [fakeIds[0], fakeIds[1]],
    });

    // Fetch messages
    const res = await api
      .get('/api/messages')
      .query({ conversationId: conversation._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You must be a member of this conversation to fetch its messages');
  });


  it('should return 400 if \'conversationId\' is missing', async () => {
    const res = await api
      .get('/api/messages')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation ID is required');
  });


  it('should return 400 if \'conversationId\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .get('/api/messages')
      .query({ conversationId: invalidId })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation ID must be a valid ObjectId');
  });

  // All page query related tests can be found in other 
  // test suites which use the exact same validation
});

describe('POST /api/messages', () => {
  const currentUser = createAuthedUser();

  it('should create a new message', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
    });

    // Gather data
    const content = faker.lorem.sentence();

    const messageInfo = {
      conversationId: conversation._id,
      content,
    };

    // Send message
    const res = await api
      .post('/api/messages')
      .set('Cookie', currentUser.cookie)
      .send(messageInfo);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('sender');
    expect(res.body).toHaveProperty('conversationId');
    expect(res.body).toHaveProperty('content');
  });


  it('should return 400 if conversation doesn\'t exist', async () => {
    // Gather data
    const content = faker.lorem.sentence();

    const messageInfo = {
      conversationId: fakeIds[0],
      content,
    };

    const res = await api
      .post('/api/messages')
      .set('Cookie', currentUser.cookie)
      .send(messageInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation doesn\'t exist');
  });


  it('should return 403 if user isn\'t a member of conversation', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [fakeIds[0], fakeIds[1]],
    });

    // Gather data
    const content = faker.lorem.sentence();

    const messageInfo = {
      conversationId: conversation._id,
      content,
    };

    // Send message
    const res = await api
      .post('/api/messages')
      .set('Cookie', currentUser.cookie)
      .send(messageInfo);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You must be a member of this conversation to send a message');
  });


  it('should return 400 if \'conversationId\' is missing', async () => {
    const messageInfo = {
      content: faker.lorem.sentence(),
    };

    const res = await api
      .post('/api/messages')
      .set('Cookie', currentUser.cookie)
      .send(messageInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation ID is required');
  });


  it('should return 400 if \'conversationId\' is invalid', async () => {
    const messageInfo = {
      conversationId: 'abc123',
      content: faker.lorem.sentence(),
    };

    const res = await api
      .post('/api/messages')
      .set('Cookie', currentUser.cookie)
      .send(messageInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation ID must be a valid ObjectId');
  });


  it('should return 400 if \'content\' is missing', async () => {
    const messageInfo = {
      conversationId: fakeIds[0],
    };

    const res = await api
      .post('/api/messages')
      .set('Cookie', currentUser.cookie)
      .send(messageInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });


  it('should return 400 if \'content\' is too long', async () => {
    const messageInfo = {
      conversationId: fakeIds[0],
      content: faker.lorem.sentence(25),
    };

    const res = await api
      .post('/api/messages')
      .set('Cookie', currentUser.cookie)
      .send(messageInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must be one hundred characters or less');
  });


  it('should return 400 if \'content\' is an empty string', async () => {
    const messageInfo = {
      conversationId: fakeIds[0],
      content: '',
    };

    const res = await api
      .post('/api/messages')
      .set('Cookie', currentUser.cookie)
      .send(messageInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must not be empty');
  });
});

describe('PUT /api/messages/:id', () => {

});
