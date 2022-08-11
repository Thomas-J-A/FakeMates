const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedUser, seedConversation, seedMessage } = require('../utils/seeds.util');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/conversations', () => {
  const currentUser = createAuthedUser();

  it('should paginate results and let client know if there are more', async () => {
    // Seed enough conversations for two pages
    // Each conversation must have at least one message
    for (let i = 0; i < 12; i++) {
      const user = await seedUser();

      const conversation = await seedConversation({
        type: 'private',
        members: [currentUser.data._id, user._id],
      });

      await seedMessage({
        sender: user._id,
        conversationId: conversation._id,
      });
    }

    // Fetch page one
    const res = await api
      .get('/api/conversations')
      .query({ type: 'private' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.conversations).toHaveLength(10);
    expect(res.body.hasMore).toBeTruthy();

    // Fetch page two
    const res2 = await api
      .get('/api/conversations')
      .query({ type: 'private' })
      .query({ page: 2 })
      .set('Cookie', currentUser.cookie);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.conversations).toHaveLength(2);
    expect(res2.body.hasMore).toBeFalsy();
  });


  it('should return some details about last message', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
    });

    // Seed a message
    await seedMessage({
      sender: user._id,
      conversationId: conversation._id,
    });

    // Fetch conversation
    const res = await api
      .get('/api/conversations')
      .query({ type: 'private' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.conversations[0].lastMessage).toHaveProperty('content');
    expect(res.body.conversations[0].lastMessage).toHaveProperty('createdAt');
    expect(res.body.conversations[0].lastMessage.sender).toHaveProperty('fullName');
  });


  it('should return some details about each member of the chat', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
    });

    // Seed a message
    await seedMessage({
      sender: user._id,
      conversationId: conversation._id,
    });

    // Fetch conversation
    const res = await api
      .get('/api/conversations')
      .query({ type: 'private' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.conversations[0].data.members).toHaveLength(1);
    expect(res.body.conversations[0].data.members[0]).toHaveProperty('fullName');
    expect(res.body.conversations[0].data.members[0]).toHaveProperty('avatarUrl');
    expect(res.body.conversations[0].data.members[0]).not.toHaveProperty('email');
    expect(res.body.conversations[0].data.members[0]).not.toHaveProperty('location');
  });


  it('should return a count of unread messages', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
    });

    // Seed a message
    await seedMessage({
      sender: user._id,
      conversationId: conversation._id,
    });

    // Fetch conversation
    const res = await api
      .get('/api/conversations')
      .query({ type: 'private' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.conversations[0]).toHaveProperty('unreadCount');
    expect(typeof res.body.conversations[0].unreadCount).toBe('number');
  });


  it('should return valid response if no conversations available', async () => {
    const res = await api
      .get('/api/conversations')
      .query({ type: 'private' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.conversations).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should return only private conversations', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a private conversation and message
    const privateConvo = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
    });

    await seedMessage({
      sender: user._id,
      conversationId: privateConvo._id,
    });

    // Seed a group conversation and message
    const groupConvo = await seedConversation({
      type: 'group',
      members: [currentUser.data._id, user._id],
    });

    await seedMessage({
      sender: user._id,
      conversationId: groupConvo._id,
    });

    // Fetch private conversation
    const res = await api
      .get('/api/conversations')
      .query({ type: 'private' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.conversations).toHaveLength(1);
    expect(res.body.conversations[0].data.type).toBe('private');
  });


  it('should return only group conversations', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a private conversation and message
    const privateConvo = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
    });

    await seedMessage({
      sender: user._id,
      conversationId: privateConvo._id,
    });

    // Seed a group conversation and message
    const groupConvo = await seedConversation({
      type: 'group',
      members: [currentUser.data._id, user._id],
    });

    await seedMessage({
      sender: user._id,
      conversationId: groupConvo._id,
    });

    // Fetch group conversation
    const res = await api
      .get('/api/conversations')
      .query({ type: 'group' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.conversations).toHaveLength(1);
    expect(res.body.conversations[0].data.type).toBe('group');
  });


  it('should not return conversations I have \'deleted\'', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a conversation, deleted by current user
    await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
      deletedBy: [currentUser.data._id],
    });

    // Fetch conversations
    const res = await api
      .get('/api/conversations')
      .query({ type: 'private' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.conversations).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should return 400 if \'type\' is missing', async () => {
    const res = await api
      .get('/api/conversations')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Type is required');
  });


  it('should return 400 if \'type\' is neither \'private\' nor \'group\'', async () => {
    const type = faker.lorem.word();

    const res = await api
      .get('/api/conversations')
      .query({ type })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Type must be either \'private\' or \'group\'');
  });
});
