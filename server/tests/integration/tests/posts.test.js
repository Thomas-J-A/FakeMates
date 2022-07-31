const path = require('path');
const { promises: fs } = require('fs');
const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../../src/app');
const dbUtil = require('../../utils/db.util');
const data = require('../data/index.data');
const models = require('../../../src/models/index.model');

// Calling supertest with the initialization 
// app creates a clearer syntax in requests
const api = supertest(app);

// To persist cookies, call the agent method
// const api = supertest.agent(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/posts', () => {
  // Seed db per describe block/endpoint in order to reduce redundancy
  // and handle references between documents more easily
  let users = [];

  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 2; i++) {
      const _user = new models.User(data.users[i]);
      await _user.save();
      
      users.push({ data: _user });
    }
  });

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
  afterEach(() => users = []);
  
  it('should fetch all user\'s posts', async () => {
    // Seed posts
    for (let i = 0; i < 2; i++) {
      const post = new models.Post({
        postedBy: users[0].data._id,
        content: data.posts[i].content,
      });
      
      await post.save();
    }
    
    // Fetch all posts
    const res = await api
      .get('/api/posts')
      .query({ userid: users[0].data._id.toString() })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body).toHaveLength(2);
  });


  it('should fetch another user\'s posts', async () => {
    // Seed posts
    for (let i = 0; i < 2; i++) {
      const post = new models.Post({
        postedBy: users[1].data._id,
        content: data.posts[i].content,
      });
      
      await post.save();
    }

    // Fetch all posts
    const res = await api
      .get('/api/posts')
      .query({ userid: users[1].data._id.toString() })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body).toHaveLength(2);
  });


  it('should return an empty array if no posts available', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: users[0].data._id.toString() })
      .set('Cookie', users[0].cookie);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: users[0].data._id.toString() });

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if userid query parameter is missing', async () => {
    const res = await api
      .get('/api/posts')
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('userid is required');
  });


  it('should return 400 if userid isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123'

    const res = await api
      .get('/api/posts')
      .query({ userid: invalidId })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('userid must be a valid ObjectId');
  });


  it('should return 400 if userid doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .get('/api/posts')
      .query({ userid: fakeId })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });
});

describe('POST /api/posts', () => {
  let user;

  // Seed database
  beforeEach(async () => {
    // Seed a user
    const _user = new models.User(data.users[0]);
    await _user.save();

    user = { data: _user };
  });

  // Authenticate user
  beforeEach(async () => {
    const userInfo = {
      email: data.users[0].email,
      password: data.users[0].password,
    };

    const res = await api
      .post('/api/auth/email')
      .send(userInfo);

    user.cookie = res.headers['set-cookie'][0];
  });
  
  it('should create a post with an image', async () => {
    const res = await api
      .post('/api/posts')
      .field('content', data.posts[0].content) 
      .attach('image', data.posts[0].image)
      .set('Cookie', user.cookie);
      
    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(user.data._id.toString());
    expect(res.body.content).toBe(data.posts[0].content);
    expect(res.body.imageUrl).toBeDefined();
    expect(res.body.likedBy).toEqual([]);
    expect(res.body.commentsCount).toBe(0);

    // Remove file from uploads directory
    // TODO: mock multer function instead of saving a real file
    await fs.unlink(res.body.imageUrl);
  });

  
  it('should create a post without an image', async () => {
    const res = await api
      .post('/api/posts')
      .field('content', data.posts[0].content)
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(user.data._id.toString());
    expect(res.body.content).toBe(data.posts[0].content);;
    expect(res.body.imageUrl).not.toBeDefined();
    expect(res.body.likedBy).toEqual([]);
    expect(res.body.commentsCount).toBe(0);
  });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .post('/api/posts')
      .field('content', data.posts[0].content) 
      .attach('image', data.posts[0].image);

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if content is missing', async () => {
    const res = await api
      .post('/api/posts')
      .attach('image', data.posts[0].image)
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });


  it('should return 400 if content is too long', async () => {
    const longContent = faker.lorem.paragraphs(10);

    const res = await api
      .post('/api/posts')
      .field('content', longContent)
      .attach('image', data.posts[0].image)
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must be less than 100 characters');
  });
  
  
  it('should return 400 if image format is incorrect', async () => {
    const gifImage = path.resolve(__dirname, '../../images/test.gif');

    const res = await api
      .post('/api/posts')
      .field('content', data.posts[0].content)
      .attach('image', gifImage)
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Image must be in PNG, JPG, or JPEG format');
  });


  it('should return 400 if more than one image is sent', async () => {
    const extraImage = path.resolve(__dirname, '../../images/test.png');

    const res = await api
      .post('/api/posts')
      .field('content', data.posts[0].content)
      .attach('image', data.posts[0].image)
      .attach('image', extraImage)
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Too many files');
  });
  

  it('should return 400 if image is too large', async () => {
    const largeImage = path.resolve(__dirname, '../../images/test-large.jpg');

    const res = await api
      .post('/api/posts')
      .field('content', data.posts[0].content)
      .attach('image', largeImage)
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('File too large');
  });
});

describe('PUT /api/posts/:id', () => {
  let users = [];
  let post;

  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 2; i++) {
      const _user = new models.User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }

    // Seed a post
    const _post = new models.Post({
      postedBy: users[0].data._id,
      content: data.posts[0].content,
    });

    await _post.save();
    post = _post;
  });

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
  afterEach(() => users = []);

  it('should like a post', async () => {
    const res = await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).toContain(users[1].data._id.toString());
  });


  it('should unlike a post', async () => {
    // Like post
    await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', users[1].cookie);

    // Unlike post
    const res = await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).not.toContain(users[1].data._id.toString());
  });


  it('should return 401 if not authenticated', async () => { 
    const res = await api
      .put(`/api/posts/${ post._id }`);

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if :id param is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .put(`/api/posts/${ invalidId }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(':id must be a valid ObjectId');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .put(`/api/posts/${ fakeId }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 403 if user attempts to like own post', async () => {
    const res = await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You can\'t like your own post');
  });
});

describe('DELETE /api/posts/:id', () => {
  let users = [];
  let post;

  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 2; i++) {
      const _user = new models.User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }

    // Seed a post
    const _post = new models.Post({
      postedBy: users[0].data._id,
      content: data.posts[0].content,
    });

    await _post.save();
    post = _post;
  });

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
  afterEach(() => users = []);

  it('should delete a post', async () => {
    const res = await api
      .delete(`/api/posts/${ post._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);
  });


  it('should delete associated comments', async () => {
    // Seed comments
    const userCount = users.length;

    for (let i = 0; i < 5; i++) {
      // Cycle through users to simulate a chat in comments
      const user = users[i % userCount];

      const comment = new models.Comment({
        postedBy: user.data._id,
        postId: post._id,
        content: data.comments[i].content,
      });

      await comment.save();
    }

    // Delete post
    const res = await api
      .delete(`/api/posts/${ post._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);

    // Verify that no comments exist for post
    const comments = await models.Comment.find({ postId: post._id }).exec();

    expect(comments).toEqual([]);
  });


  // it('should delete an associated image', async () => {

  // });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .delete(`/api/posts/${ post._id }`)

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if :id path param is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .delete(`/api/posts/${ invalidId }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(':id must be a valid ObjectId');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .delete(`/api/posts/${ fakeId }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 403 if user attempts to delete another user\'s post', async () => {
    const res = await api
      .delete(`/api/posts/${ post._id }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only remove your own posts');
  });
});
