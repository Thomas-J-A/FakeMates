const path = require('path');
const { promises: fs } = require('fs');
const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const seeds = require('../seeds/index.seed');

// Calling supertest with the initialization 
// app creates a clearer syntax in requests
const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

const createUser = async (userInfo) => {
  const res = await api
    .post('/api/auth/register')
    .send(userInfo);

  return {
    body: res.body,
    headers: res.headers,
  };
};

const createPost = async (currentUser, cookie, postInfo) => {
  const res = await api
    .post('/api/posts')
    .field('postedBy', currentUser._id)
    .field('content', postInfo.content)
    // .attach('image', postInfo.image)
    .set('Cookie', cookie);

  return {
    body: res.body,
  };
};

let currentUser;

// Explicitly add JWT token (inside cookie)
// to all requests which require authentication
let cookie;
  
// Sign in before attempting to perform CRUD operations on a post
beforeEach(async () => {
  const { body, headers } = await createUser(seeds.users[0]);
  currentUser = body.currentUser;
  cookie = headers['set-cookie'][0];
});

describe('GET /api/posts', () => {
  let posts = [];

  // Save two posts to the database before each test
  beforeEach(async () => {
    for (let i = 0; i < 2; i++) {
      const { body } = await createPost(currentUser, cookie, seeds.posts[i]);
      posts.push(body);
    }
  });

  // Empty posts array between tests
  afterEach(() => posts = []);
  
  it('should fetch all user\'s posts', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: currentUser._id })
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(2);
  });


  it('should fetch another user\'s posts', async () => {
      // Create a second user
    const { body, headers } = await createUser(seeds.users[1]);
    currentUser = body.currentUser;
    cookie = headers['set-cookie'][0];
    
    const res = await api
      .get('/api/posts')
      .query({ userid: posts[0].postedBy })
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(2);
  });


  it('should return an empty array if no posts available', async () => {
    // Create a second user
    const { body, headers } = await createUser(seeds.users[1]);
    currentUser = body.currentUser;
    cookie = headers['set-cookie'][0];

    const res = await api
      .get('/api/posts')
      .query({ userid: currentUser._id })
      .set('Cookie', cookie);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(0);
  });


  it('should return 401 if not signed in', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: currentUser._ud });

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if userid query parameter is missing', async () => {
    const res = await api
      .get('/api/posts')
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('userid is required');
  });


  it('should return 400 if userid isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123'

    const res = await api
      .get('/api/posts')
      .query({ userid: invalidId })
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('userid must be a valid ObjectId');
  });


  it('should return 400 if userid doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .get('/api/posts')
      .query({ userid: fakeId })
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });
});

describe('POST /api/posts', () => { 
  it('should create a post with an image', async () => {
    const res = await api
      .post('/api/posts')
      .field('postedBy', currentUser._id)
      .field('content', seeds.posts[0].content) 
      .attach('image', seeds.posts[0].image)
      .set('Cookie', cookie);
      
    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(currentUser._id);
    expect(res.body.content).toBe(seeds.posts[0].content);
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
      .field('postedBy', currentUser._id)
      .field('content', seeds.posts[0].content)
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(currentUser._id);
    expect(res.body.content).toBe(seeds.posts[0].content);;
    expect(res.body.imageUrl).not.toBeDefined();
    expect(res.body.likedBy).toEqual([]);
    expect(res.body.commentsCount).toBe(0);
  });


  it('should return 401 if not signed in', async () => {
    const res = await api
      .post('/api/posts')
      .field('postedBy', currentUser._id)
      .field('content', seeds.posts[0].content) 
      .attach('image', seeds.posts[0].image);

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if poster ID is missing', async () => {
    const res = await api
      .post('/api/posts')
      .field('content', seeds.posts[0].content)
      .attach('image', seeds.posts[0].image)
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Poster ID is required');
  });


  it('should return 400 if poster ID isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123';

    const res = await api
      .post('/api/posts')
      .field('postedBy', invalidId)
      .field('content', seeds.posts[0].content)
      .attach('image', seeds.posts[0].image)
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Poster ID must be a valid ObjectId');
  });


  it('should return 400 if content is missing', async () => {
    const res = await api
      .post('/api/posts')
      .field('postedBy', currentUser._id)
      .attach('image', seeds.posts[0].image)
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });


  it('should return 400 if content is too long', async () => {
    const longContent = faker.lorem.paragraphs(10);

    const res = await api
      .post('/api/posts')
      .field('postedBy', currentUser._id)
      .field('content', longContent)
      .attach('image', seeds.posts[0].image)
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must be less than 100 characters');
  });
  
  
  it('should return 400 if image format is incorrect', async () => {
    const gifImage = path.resolve(__dirname, '../images/test.gif');

    const res = await api
      .post('/api/posts')
      .field('postedBy', currentUser._id)
      .field('content', seeds.posts[0].content)
      .attach('image', gifImage)
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Image must be in PNG, JPG, or JPEG format');
  });


  it('should return 400 if more than one image is sent', async () => {
    const extraImage = path.resolve(__dirname, '../images/test.png');

    const res = await api
      .post('/api/posts')
      .field('postedBy', currentUser._id)
      .field('content', seeds.posts[0].content)
      .attach('image', seeds.posts[0].image)
      .attach('image', extraImage)
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Too many files');
  });
  

  it('should return 400 if image is too large', async () => {
    const largeImage = path.resolve(__dirname, '../images/test-large.jpg');

    const res = await api
      .post('/api/posts')
      .field('postedBy', currentUser._id)
      .field('content', seeds.posts[0].content)
      .attach('image', largeImage)
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('File too large');
  });
});

describe('PUT /api/posts/:id', () => {
  // Get a reference to post doc so you can use its _id 
  // as a path parameter in requests
  let post;

  // Save a post to the database before each test
  beforeEach(async () => {
    const { body } = await createPost(currentUser, cookie, seeds.posts[0]);
    post = body;
  });

  it('should like a post', async () => {
    // Create a second user
    const { body, headers } = await createUser(seeds.users[1]);
    currentUser = body.currentUser;
    cookie = headers['set-cookie'][0];

    const res = await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).toContain(currentUser._id);
  });


  it('should unlike a post', async () => {
    // Create a second user
    const { body, headers } = await createUser(seeds.users[1]);
    currentUser = body.currentUser;
    cookie = headers['set-cookie'][0];

    // Like post
    await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', cookie)

    // Unlike post
    const res = await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).not.toContain(currentUser._id);
  });


  it('should return 401 if not signed in', async () => { 
    // Create a second user
    const { body, headers } = await createUser(seeds.users[1]);
    currentUser = body.currentUser;
    cookie = headers['set-cookie'][0];

    const res = await api
      .put(`/api/posts/${ post._id }`)

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if :id param is invalid', async () => {
    // Create a second user
    const { body, headers } = await createUser(seeds.users[1]);
    currentUser = body.currentUser;
    cookie = headers['set-cookie'][0];

    const invalidId = 'abc123';

    const res = await api
      .put(`/api/posts/${ invalidId }`)
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(':id must be a valid ObjectId');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    // Create a second user
    const { body, headers } = await createUser(seeds.users[1]);
    currentUser = body.currentUser;
    cookie = headers['set-cookie'][0];

    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .put(`/api/posts/${ fakeId }`)
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 403 if user attempts to like own post', async () => {
    const res = await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You can\'t like your own post');
  });
});

describe('DELETE /api/posts/:id', () => {
  // Get a reference to post doc so you can use its _id 
  // as a path parameter in requests
  let post;

  // Save a post to the database before each test
  beforeEach(async () => {
    const { body } = await createPost(currentUser, cookie, seeds.posts[0]);
    post = body;
  });

  it('should delete a post', async () => {
    const res = await api
      .delete(`/api/posts/${ post._id }`)
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(204);
  });


  // it('should delete all associated comments', async () => {

  // });


  // it('should delete an associated image', async () => {

  // });


  it('should return 401 if not signed in', async () => {
    const res = await api
      .delete(`/api/posts/${ post._id }`)

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if :id path param is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .delete(`/api/posts/${ invalidId }`)
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(':id must be a valid ObjectId');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .delete(`/api/posts/${ fakeId }`)
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 403 if user attempts to delete another user\'s post', async () => {
    // Create a second user
    const { body, headers } = await createUser(seeds.users[1]);
    currentUser = body.currentUser;
    cookie = headers['set-cookie'][0];

    const res = await api
      .delete(`/api/posts/${ post._id }`)
      .set('Cookie', cookie)

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only remove your own posts');
  });
});

// To persist cookies, call the agent method
// const api = supertest.agent(app);
