 const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedUser, seedConversation, seedMessage } = require('../utils/seeds.util');
const fakeIds = require('../utils/fakeIds.util');
const models = require('../../src/models/index.model');

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
      admin: currentUser.data._id,
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

    const messageInfo = {
      conversationId: conversation._id,
      content: faker.lorem.sentence(),
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


  it('should let other members who have deleted the chat see the message', async () => {
    // Seed a conversation which one of the members has deleted
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
      deletedBy: [fakeIds[0]],
    });

    const messageInfo = {
      conversationId: conversation._id,
      content: faker.lorem.sentence(),
    };

    // Send message
    const res = await api
      .post(`/api/messages`)
      .set('Cookie', currentUser.cookie)
      .send(messageInfo);

    expect(res.statusCode).toBe(201);
  });


  it('should return 400 if conversation doesn\'t exist', async () => {
    const messageInfo = {
      conversationId: fakeIds[0],
      content: faker.lorem.sentence(),
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

    const messageInfo = {
      conversationId: conversation._id,
      content: faker.lorem.sentence(),
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

describe('POST /api/messages/actions', () => {
  const currentUser = createAuthedUser();

  it('should mark all unread messages as read, even if some aren\'t visible in UI', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
    });

    // Seed enough messages for two pages
    // Only first 20 messages are displayed but messages 21/22 also must be marked as read
    for (let i = 0; i < 22; i++) {
      await seedMessage({
        sender: fakeIds[0],
        conversationId: conversation._id,
      });
    }

    // Body data
    const body = {
      type: 'mark-as-read',
      conversationId: conversation._id,
    };

    // Mark unread messages as read
    const res = await api
      .post('/api/messages/actions')
      .set('Cookie', currentUser.cookie)
      .send(body);

    expect(res.statusCode).toBe(204);

    // Verify that all messages have been marked as read for current user
    const messages = await models.Message.find({ conversationId: conversation._id }).exec();

    messages.forEach((m) => {
      expect(m.readBy).toContainEqual(currentUser.data._id);
    });
  });


  it('should return 400 if conversation doesn\'t exist', async () => {
    const body = {
      type: 'mark-as-read',
      conversationId: fakeIds[0],
    };

    const res = await api
      .post('/api/messages/actions')
      .set('Cookie', currentUser.cookie)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation doesn\'t exist');
  });


  it('should return 403 if user isn\'t a member of conversation', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [fakeIds[0], fakeIds[1]],
    });

    const body = {
      type: 'mark-as-read',
      conversationId: conversation._id,
    };

    const res = await api
      .post('/api/messages/actions')
      .set('Cookie', currentUser.cookie)
      .send(body);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You must be a member of this conversation to update its messages');
  });


  it('should return 400 if \'type\' is missing', async () => {
    const body = {
      conversationId: fakeIds[0],
    };

    const res = await api
      .post('/api/messages/actions')
      .set('Cookie', currentUser.cookie)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Type is required');
  });


  it('should return 400 if \'type\' is not \'mark-as-read\'', async () => {
    const body = {
      type: faker.word.verb(),
      conversationId: fakeIds[0],
    };

    const res = await api
      .post('/api/messages/actions')
      .set('Cookie', currentUser.cookie)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Type must be \'mark-as-read\'');
  });


  it('should return 400 if \'conversationId\' is missing', async () => {
    const body = {
      type: 'mark-as-read',
    };

    const res = await api
      .post('/api/messages/actions')
      .set('Cookie', currentUser.cookie)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation ID is required');
  });


  it('should return 400 if \'converationId\' is invalid', async () => {
    const body = {
      type: 'mark-as-read',
      conversationId: 'abc123',
    };

    const res = await api
      .post('/api/messages/actions')
      .set('Cookie', currentUser.cookie)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation ID must be a valid ObjectId');
  });
});
