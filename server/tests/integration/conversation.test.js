const path = require('path');
const { promises: fs } = require('fs');
const supertest = require('supertest');
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedUser, seedConversation, seedMessage } = require('../utils/seeds.util');
const fakeIds = require('../utils/fakeIds.util');

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

describe('POST /api/conversations', () => {
  const currentUser = createAuthedUser();

  it('should create a new private conversation', async () => {
    // Seed a second user
    const user = await seedUser();

    const res = await api
      .post('/api/conversations')
      .query({ type: 'private' })
      .set('Cookie', currentUser.cookie)
      .send({ memberId: user._id });

    expect(res.statusCode).toBe(201);
  });


  it('should create a new group conversation with an avatar', async () => {
    // Seed two users
    const user = await seedUser();
    const user2 = await seedUser();

    const name = faker.lorem.word(10);
    const memberIds = [user._id.toString(), user2._id.toString()];
    const avatarUrl = path.resolve(__dirname, '../images/test.jpg');

    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .attach('avatar', avatarUrl)
      .set('Cookie', currentUser.cookie)

    expect(res.statusCode).toBe(201);
    expect(res.body.avatarUrl).not.toContain('group-avatar.jpg'); // This is the default image file

    // Remove file from uploads directory
    await fs.unlink(res.body.avatarUrl);
  });


  it('should create a new group conversation without an avatar', async () => {
    // Seed two users
    const user = await seedUser();
    const user2 = await seedUser();

    const name = faker.lorem.word(10);
    const memberIds = [user._id.toString(), user2._id.toString()];

    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(201);
    expect(res.body.avatarUrl).toContain('group-avatar.jpg'); // This is the default image file
  });


  it('should return existing conversation if user deletes and then resumes chat', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a chat which current user has 'deleted'
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
      deletedBy: [currentUser.data._id],
    });

    // Attempt to create a new chat with second user
    const res = await api
      .post('/api/conversations')
      .query({ type: 'private' })
      .set('Cookie', currentUser.cookie)
      .send({ memberId: user._id });

    // Verify that returned conversation is original chat document (not newly created)
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(conversation._id.toString());
  });


  it('should return 403 if private conversation already exists', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
    });

    // Attempt to create a new chat
    const res = await api
      .post('/api/conversations')
      .query({ type: 'private' })
      .set('Cookie', currentUser.cookie)
      .send({ memberId: user._id });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Conversation already exists');
  });


  it('should return 400 if \'type\' is missing', async () => {
    const res = await api
      .post('/api/conversations')
      .set('Cookie', currentUser.cookie)
      .send({ memberId: fakeIds[0] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Type is required');
  });


  it('should return 400 if \'type\' is neither \'private\' nor \'group\'', async () => {
    const type = faker.lorem.word();

    const res = await api
      .post('/api/conversations')
      .query({ type })
      .set('Cookie', currentUser.cookie)
      .send({ memberId: fakeIds[0] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Type must be either \'private\' or \'group\'');
  });


  it('should return 400 if \'memberId\' is missing', async () => {
    const res = await api
      .post('/api/conversations')
      .query({ type: 'private' })
      .set('Cookie', currentUser.cookie)
      .send();

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Member ID is required');
  });


  it('should return 400 if \'memberId\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .post('/api/conversations')
      .query({ type: 'private' })
      .set('Cookie', currentUser.cookie)
      .send({ memberId: invalidId });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Member ID must be a valid ObjectId');
  });


  it('should return 400 if \'memberId\' is an empty string', async () => {
    const memberId = '';

    const res = await api
      .post('/api/conversations')
      .query({ type: 'private' })
      .set('Cookie', currentUser.cookie)
      .send({ memberId });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Member ID must not be empty');
  });


  it('should return 400 if other member of private chat doesn\'t exist', async () => {
    const res = await api
      .post('/api/conversations')
      .query({ type: 'private' })
      .set('Cookie', currentUser.cookie)
      .send({ memberId: fakeIds[0] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  })


  it('should return 400 if \'name\' is missing', async () => {
    const memberIds = [fakeIds[0], fakeIds[1]];

    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Name is required');
  });


  it('should return 400 if \'name\' is too long', async () => {
    const name = faker.lorem.sentence(10);
    const memberIds = [fakeIds[0], fakeIds[1]];
    
    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Name must be twenty characters or less');
  });


  it('should return 400 if \'name\' is an empty string', async () => {
    const name = '';
    const memberIds = [fakeIds[0], fakeIds[1]];
    
    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Name must not be empty');
  });


  it('should return 400 if \'memberIds\' is missing', async () => {
    const name = faker.lorem.word(10);

    const res = await api
      .post('/api/conversations')
      .query({ 'type': 'group' })
      .field({ name })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Member IDs list is required');
  });


  it('should return 400 if \'memberIds\' isn\'t an array', async () => {
    const name = faker.lorem.word(10);
    const memberIds = faker.lorem.sentence();
    
    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie);
      
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Member IDs list must be an array');
  });


  it('should return 400 if \'memberIds\' contains too many members', async () => {
    const name = faker.lorem.word(10);
    const memberIds = Array.from({ length: 9 }, () => new mongoose.Types.ObjectId().toString());

    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Member IDs list must contain eight or fewer IDs');
  });


  it('should return 400 if \'memberIds\' is empty', async () => {
    const name = faker.lorem.word(10);
    const memberIds = [];

    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie)

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Member IDs list is required');

  });


  it('should return 400 if \'memberIds\' contains invalid IDs', async () => {
    const name = faker.lorem.word(10);
    const memberIds = [fakeIds[0], 'abc123'];

    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie)

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Member IDs list must contain only valid ObjectIds');
  });


  it('should return 400 if \'memberIds\' contains empty strings', async () => {
    const name = faker.lorem.word(10);
    const memberIds = [fakeIds[0], ''];

    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie)

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Member IDs list must not contain empty strings');
  });


  it('should return 400 if not all members of group chat exist', async () => {
    // Seed a second user
    const user = await seedUser();

    const name = faker.lorem.word(10);
    const memberIds = [fakeIds[1], user._id.toString(), fakeIds[0]];

    const res = await api
      .post('/api/conversations')
      .query({ type: 'group' })
      .field({ name })
      .field({ memberIds })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('At least one of the users doesn\'t exist');
  });
});
