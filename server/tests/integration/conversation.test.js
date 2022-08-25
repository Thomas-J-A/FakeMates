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
const models = require('../../src/models/index.model');

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
      admin: currentUser.data._id,
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
      admin: currentUser.data._id,
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

    // Give current user a friend
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

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

    // Give current user these two as friends
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: [user._id, user2._id ] },
    }).exec();

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

    // Give current user these two as friends
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: [user._id, user2._id ] },
    }).exec();

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

    // Give current user a friend
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

    // Seed a chat which current user has 'deleted'
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, user._id],
      deletedBy: [currentUser.data._id],
    });

    // Attempt to create a new chat with same members
    const res = await api
      .post('/api/conversations')
      .query({ type: 'private' })
      .set('Cookie', currentUser.cookie)
      .send({ memberId: user._id });

    // Verify that returned conversation is original chat document (not newly created)
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(conversation._id.toString());
    expect(res.body.deletedBy).toHaveLength(0);
  });


  it('should return 403 if other member isn\'t a friend in a private conversation', async () => {
    // Seed a second user
    const user = await seedUser();

    const res = await api
      .post('/api/conversations')
      .query({ type: 'private' })
      .set('Cookie', currentUser.cookie)
      .send({ memberId: user._id });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only chat with friends');
  });


  it('should return 403 if other members aren\'t friends of current user in a group conversation', async () => {
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

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only chat with friends');
  });


  it('should return 403 if private conversation already exists', async () => {
    // Seed a second user
    const user = await seedUser();

    // Give current user a friend
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

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

describe('PUT /api/conversations/:id', () => {
  const currentUser = createAuthedUser();

  describe('action=delete-chat', () => {
    it('should mark a private chat as deleted', async () => {
      // Seed a private conversation
      const conversation = await seedConversation({
        type: 'private',
        members: [currentUser.data._id, fakeIds[0]],
      });

      // Delete chat
      const res = await api
        .put(`/api/conversations/${ conversation._id }`)
        .query({ action: 'delete-chat' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(204);

      // Verify that chat is marked as deleted by current user
      const conversationDoc = await models.Conversation.findById(conversation._id).exec();

      expect(conversationDoc.deletedBy).toContainEqual(currentUser.data._id);
    });


    it('should mark a group chat as deleted', async () => {
      // Seed a group conversation
      const conversation = await seedConversation({
        type: 'group',
        admin: currentUser.data._id,
        members: [currentUser.data._id, fakeIds[0], fakeIds[1]],
      });

      // Delete chat
      const res = await api
        .put(`/api/conversations/${ conversation._id }`)
        .query({ action: 'delete-chat' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(204);

      // Verify that chat is marked as deleted by current user
      const conversationDoc = await models.Conversation.findById(conversation._id).exec();
      
      expect(conversationDoc.deletedBy).toContainEqual(currentUser.data._id);
    });


    it('should mark associated messages as read and deleted', async () => {
      // Seed a conversation
      const conversation = await seedConversation({
        type: 'private',
        members: [currentUser.data._id, fakeIds[0]],
      });

      // Seed a message
      const message = await seedMessage({
        sender: currentUser.data._id,
        conversationId: conversation._id,
      });

      // Delete chat
      const res = await api
        .put(`/api/conversations/${ conversation._id }`)
        .query({ action: 'delete-chat' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(204);

      // Verify that message is marked as read and deleted by current user
      const messageDoc = await models.Message.findById(message._id).exec();

      expect(messageDoc.readBy).toContainEqual(currentUser.data._id)
      expect(messageDoc.deletedBy).toContainEqual(currentUser.data._id);

      // Verify that second member can still access message
      expect(messageDoc.deletedBy).not.toContainEqual(fakeIds[0]);
    });


    it('should return 403 if user has already \'deleted\' chat', async () => {
      // Seed a conversation marked as deleted by current user
      const conversation = await seedConversation({
        type: 'private',
        members: [currentUser.data._id, fakeIds[0]],
        deletedBy: [currentUser.data._id],
      });

      // Delete chat
      const res = await api
        .put(`/api/conversations/${ conversation._id }`)
        .query({ action: 'delete-chat' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You have already deleted this conversation');
    });
  });
  
  describe('action=leave-group', () => {
    it('should remove user from group and inform remaining members', async () => {
      // Seed a group conversation
      const conversation = await seedConversation({
        type: 'group',
        admin: fakeIds[0],
        members: [currentUser.data._id, fakeIds[0], fakeIds[1]],
      });

      // Leave group
      const res = await api
        .put(`/api/conversations/${ conversation._id }`)
        .query({ action: 'leave-group' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(204);

      // Verify that current user is no longer in group
      const conversationDoc = await models.Conversation.findById(conversation._id).exec();

      expect(conversationDoc.members).not.toContainEqual(currentUser.data._id);

      // Verify that there is a notification message in database
      const messageDoc = await models.Message.findOne({
        conversationId: conversation._id,
        type: 'notification',
      }).exec();

      expect(messageDoc.content).toBe(`${ currentUser.data.fullName } has left the group.`);
    });


    it('should assign a new admin and inform remaining members if user is current admin', async () => {
      // Seed a second user
      const user = await seedUser();

      // Seed a group conversation with current user as admin
      const conversation = await seedConversation({
        type: 'group',
        admin: currentUser.data._id,
        members: [currentUser.data._id, user._id],
      });

      // Leave group
      const res = await api
        .put(`/api/conversations/${ conversation._id }`)
        .query({ action: 'leave-group' })
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


    it('should mark associated messages as read and deleted', async () => {
      // Seed a group conversation
      const conversation = await seedConversation({
        type: 'group',
        admin: fakeIds[0],
        members: [currentUser.data._id, fakeIds[0]],
      });

      // Seed a message
      const message = await seedMessage({
        sender: currentUser.data._id,
        conversationId: conversation._id,
      });

      // Leave group
      const res = await api
        .put(`/api/conversations/${ conversation._id }`)
        .query({ action: 'leave-group' })
        .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(204);

      // Verify that message is marked as read and deleted by current user
      const messageDoc = await models.Message.findById(message._id).exec();

      expect(messageDoc.readBy).toContainEqual(currentUser.data._id);
      expect(messageDoc.deletedBy).toContainEqual(currentUser.data._id);
    });
  });

  it('should remove chat and its messages if all members mark as deleted', async () => {
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

    // Delete chat
    const res = await api
      .put(`/api/conversations/${ conversation._id }`)
      .query({ action: 'delete-chat' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);
    
    // Verify that conversation has been removed
    const conversationDoc = await models.Conversation.findById(conversation._id).exec();

    expect(conversationDoc).toBeNull();

    // Verify that associated messages have been removed
    const messageDocs = await models.Message.find({ conversationId: conversation._id }).exec();

    expect(messageDocs).toHaveLength(0);
  });


  it('should remove message if all members mark as deleted', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
    });

    // Seed a message marked as deleted by one member
    const message = await seedMessage({
      sender: currentUser.data._id,
      conversationId: conversation._id,
      readBy: [fakeIds[0]],
      deletedBy: [fakeIds[0]],
    });

    // Delete chat
    const res = await api
      .put(`/api/conversations/${ conversation._id }`)
      .query({ action: 'delete-chat' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that message has been removed
    const messageDoc = await models.Message.findById(message._id).exec();

    expect(messageDoc).toBeNull();
  });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .put(`/api/conversations/${ invalidId }`)
      .query({ action: 'delete-chat' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if \'action\' is missing', async () => {
    const res = await api
      .put(`/api/conversations/${ fakeIds[0] }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Action is required');
  });


  it('should return 400 if \'action\' is neither \'delete-chat\' nor \'leave-group\'', async () => {
    const invalidAction = faker.word.verb();

    const res = await api
      .put(`/api/conversations/${ fakeIds[0] }`)
      .query({ action: invalidAction })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Action must be either \'delete-chat\' or \'leave-group\'');
  });


  it('should return 400 if chat doesn\'t exist', async () => {
    const res = await api
      .put(`/api/conversations/${ fakeIds[0] }`)
      .query({ action: 'delete-chat' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation doesn\'t exist');
  });


  it('should return 403 if user isn\'t part of chat', async () => {
    // Seed a conversation between two other users
    const conversation = await seedConversation({
      type: 'private',
      members: [fakeIds[0], fakeIds[1]],
    });

    // Attempt to delete chat with current user
    const res = await api
      .put(`/api/conversations/${ conversation._id }`)
      .query({ action: 'delete-chat' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You must be a member of this conversation to update record');
  });
});

describe('DELETE /api/conversations/:id', () => {
  const currentUser = createAuthedUser();

  it('should delete a group conversation', async () => {
    // Seed a group conversation
    const conversation = await seedConversation({
      type: 'group',
      admin: currentUser.data._id,
      members: [currentUser.data._id, fakeIds[0], fakeIds[1]],
    });

    // Delete group
    const res = await api
      .delete(`/api/conversations/${ conversation._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that conversation has been removed
    const conversationDoc = await models.Conversation.findById(conversation._id).exec();

    expect(conversationDoc).toBeNull();
  });


  it('should remove associated messages', async () => {
    // Seed a group conversation
    const conversation = await seedConversation({
      type: 'group',
      admin: currentUser.data._id,
      members: [currentUser.data._id, fakeIds[0], fakeIds[1]],
    });

    // Seed a message
    const message = await seedMessage({
      sender: currentUser.data._id,
      conversationId: conversation._id,
    });

    // Delete group
    const res = await api
      .delete(`/api/conversations/${ conversation._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that message has been removed
    const messageDoc = await models.Message.findById(message._id).exec();

    expect(messageDoc).toBeNull();
  });


  it('should return 400 if conversation doesn\'t exist', async () => {
    const res = await api
      .delete(`/api/conversations/${ fakeIds[0] }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Conversation doesn\'t exist');
  });


  it('should return 400 if user attempts to delete a private conversation', async () => {
    // Seed a private conversation
    const conversation = await seedConversation({
      type: 'private',
      members: [currentUser.data._id, fakeIds[0]],
    });

    // Delete group
    const res = await api
      .delete(`/api/conversations/${ conversation._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('You may only unilaterally delete a group conversation');
  });


  it('should return 403 if user is not the creator of conversation', async () => {
    // Seed a conversation
    const conversation = await seedConversation({
      type: 'group',
      admin: fakeIds[0],
      members: [fakeIds[0], fakeIds[1], currentUser.data._id],
    });

    // Delete group
    const res = await api
      .delete(`/api/conversations/${ conversation._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Only the creator of the group may delete this conversation');
  });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .delete(`/api/conversations/${ invalidId }`)
      .set('Cookie', currentUser.cookie);

      expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });
});
