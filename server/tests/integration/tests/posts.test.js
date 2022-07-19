const path = require('path');
const { promises: fs } = require('fs');
const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../../src/app');
const dbUtil = require('../../utils/db.util');
const seeds = require('../seeds/post.seed');
const data = require('../data/index.data');
const Comment = require('../../../src/models/comment.model');

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

  // Seed database
  let { users, posts } = seeds.fetchPosts();

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

  // Clear arrays after each test
  afterEach(() => {
    // users/posts variables are references and so
    // users = [] would overwrite them with a new value;
    // users.length = 0 empties the referenced value itself
    users.length = 0;
    posts.length = 0;
  });
  
  it('should fetch all user\'s posts', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: users[0].data._id.toString() })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body).toHaveLength(2);
    // expect(res.body).toEqual(posts);
  });


  it('should fetch another user\'s posts', async () => {  
    const res = await api
      .get('/api/posts')
      .query({ userid: users[0].data._id.toString() })
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body).toHaveLength(2);
    // expect(res.body).toEqual(posts);
  });


  it('should return an empty array if no posts available', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: users[1].data._id.toString() })
      .set('Cookie', users[1].cookie);
    
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
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('userid is required');
  });


  it('should return 400 if userid isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123'

    const res = await api
      .get('/api/posts')
      .query({ userid: invalidId })
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('userid must be a valid ObjectId');
  });


  it('should return 400 if userid doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .get('/api/posts')
      .query({ userid: fakeId })
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });
});

describe('POST /api/posts', () => {
  // Seed database
  let users = seeds.createPost();

  // Authenticate user
  beforeEach(async () => {
    const userInfo = {
      email: data.users[0].email,
      password: data.users[0].password,
    };

    const res = await api
      .post('/api/auth/email')
      .send(userInfo);

    users[0].cookie = res.headers['set-cookie'][0];
  });

  // Clear array after each test
  afterEach(() => users.length = 0);
  
  it('should create a post with an image', async () => {
    const res = await api
      .post('/api/posts')
      .field('content', data.posts[0].content) 
      .attach('image', data.posts[0].image)
      .set('Cookie', users[0].cookie);
      
    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(users[0].data._id.toString());
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
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(users[0].data._id.toString());
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
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });


  it('should return 400 if content is too long', async () => {
    const longContent = faker.lorem.paragraphs(10);

    const res = await api
      .post('/api/posts')
      .field('content', longContent)
      .attach('image', data.posts[0].image)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must be less than 100 characters');
  });
  
  
  it('should return 400 if image format is incorrect', async () => {
    const gifImage = path.resolve(__dirname, '../../images/test.gif');

    const res = await api
      .post('/api/posts')
      .field('content', data.posts[0].content)
      .attach('image', gifImage)
      .set('Cookie', users[0].cookie);

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
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Too many files');
  });
  

  it('should return 400 if image is too large', async () => {
    const largeImage = path.resolve(__dirname, '../../images/test-large.jpg');

    const res = await api
      .post('/api/posts')
      .field('content', data.posts[0].content)
      .attach('image', largeImage)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('File too large');
  });
});

describe('PUT /api/posts/:id', () => {
  // Seed database
  let { users, posts } = seeds.likePost();

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

  // Clear arrays after each test
  afterEach(() => {
    users.length = 0;
    posts.length = 0;
  });

  it('should like a post', async () => {
    const res = await api
      .put(`/api/posts/${ posts[0]._id }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).toContain(users[1].data._id.toString());
  });


  it('should unlike a post', async () => {
    // Like post
    await api
      .put(`/api/posts/${ posts[0]._id }`)
      .set('Cookie', users[1].cookie);

    // Unlike post
    const res = await api
      .put(`/api/posts/${ posts[0]._id }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).not.toContain(users[1].data._id.toString());
  });


  it('should return 401 if not authenticated', async () => { 
    const res = await api
      .put(`/api/posts/${ posts[0]._id }`);

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
      .put(`/api/posts/${ posts[0]._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You can\'t like your own post');
  });
});

describe('DELETE /api/posts/:id', () => {
  // Seed database
   let { users, posts } = seeds.removePost();

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

  // Clear arrays after each test
  afterEach(() => {
    users.length = 0;
    posts.length = 0;
  });

  it('should delete a post', async () => {
    const res = await api
      .delete(`/api/posts/${ posts[0]._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(204);
  });


  it('should delete associated comments', async () => {
      const userCount = users.length;

    // Seed comments for first post
    for (let i = 0; i < 3; i++) {
      // Cycle through users to simulate a chat in comments
      const _user = users[i % userCount];
      const _comment = new Comment({
        postedBy: _user.data._id,
        postId: posts[0]._id,
        content: data.comments[i].content,
      });

      await _comment.save();
    }

    // Seed comments for second post
    for (let i = 0; i < 3; i++) {
      const _user = users[i % userCount];
      const _comment = new Comment({
        postedBy: _user.data._id,
        postId: posts[1]._id,
        content: data.comments[i + 3].content,
      });

      await _comment.save();
    }

    // Delete post one
    await api
      .delete(`/api/posts/${ posts[0]._id }`)
      .set('Cookie', users[0].cookie);

    // Verify that no comments with first post's id remain in db
    const res = await api
      .get('/api/comments')
      .query({ postid: posts[0]._id.toString() })
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');

    // Verify that comments with second post's id still remain in db, unaffected
    const res2 = await api
      .get('/api/comments')
      .query({ postid: posts[1]._id.toString() })
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.comments).toHaveLength(3);
  });


  // it('should delete an associated image', async () => {

  // });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .delete(`/api/posts/${ posts[0]._id }`)

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
      .delete(`/api/posts/${ posts[0]._id }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only remove your own posts');
  });
});
