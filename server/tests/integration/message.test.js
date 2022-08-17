const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedConversation } = require('../utils/seeds.util');
const fakeIds = require('../utils/fakeIds.util');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/messages', () => {
  
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
