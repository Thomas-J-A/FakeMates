const path = require('path');
const { promises: fs } = require('fs');
const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedUser, seedPost, seedComment } = require('../utils/seeds.util');
const fakeIds = require('../utils/fakeIds.util');
const models = require('../../src/models/index.model');

// Calling supertest with the initialization 
// app creates a clearer syntax in requests
const api = supertest(app);

// To persist cookies, call the agent method
// const api = supertest.agent(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/posts', () => {
  const currentUser = createAuthedUser();

  it('should paginate results and let client know if there are more', async () => {
    // Seed enough posts for two pages (current user's posts)
    for (let i = 0; i < 12; i++) {
      await seedPost({ postedBy: currentUser.data._id });
    }

    // Fetch page one
    const res = await api
      .get('/api/posts')
      .query({ userid: currentUser.data._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toHaveLength(10);
    expect(res.body.hasMore).toBeTruthy();

    // Fetch page two
    const res2 = await api
      .get('/api/posts')
      .query({ userid: currentUser.data._id.toString() })
      .query({ page: 2 })
      .set('Cookie', currentUser.cookie);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.posts).toHaveLength(2);
    expect(res2.body.hasMore).toBeFalsy();
  });
  

  it('should fetch another user\'s posts', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed posts created by second user
    for (let i = 0; i < 2; i++) {
      await seedPost({ postedBy: user._id });
    }

    // Fetch all posts for second user
    const res = await api
      .get('/api/posts')
      .query({ userid: user._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toHaveLength(2);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should return valid response if no posts available', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: currentUser.data._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: fakeIds[0] })
      .query({ page: 1 });

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if \'userid\' is missing', async () => {
    const res = await api
      .get('/api/posts')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User ID is required');
  });


  it('should return 400 if \'userid\' isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123'

    const res = await api
      .get('/api/posts')
      .query({ userid: invalidId })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User ID must be a valid ObjectId');
  });


  it('should return 400 if \'userid\' is an empty string', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: '' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User ID must not be empty');
  });


  it('should return 400 if user doesn\'t exist', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: fakeIds[0] })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User doesn\'t exist');
  });

  it('should return 400 if \'page\' is missing', async () => {
    const res = await api
      .get('/api/posts')
      .query({ userid: fakeIds[0] })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page is required');
  });

  // Other page query parameter related tests can be found in 
  // other test files which make the same paginated request
  // and are validated in exactly the same manner
});

describe('POST /api/posts', () => {
  const currentUser = createAuthedUser();
  
  it('should create a post with an image', async () => {
    const content = faker.lorem.sentence();
    const imageUrl = path.resolve(__dirname, '../images/test.jpg');

    const res = await api
      .post('/api/posts')
      .field('content', content )
      .attach('image', imageUrl)
      .set('Cookie', currentUser.cookie);
      
    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(currentUser.data._id.toString());
    expect(res.body.content).toBe(content);
    expect(res.body.imageUrl).toBeDefined();
    expect(res.body.likedBy).toEqual([]);
    expect(res.body.commentsCount).toBe(0);

    // Remove file from uploads directory
    // TODO: mock multer function instead of saving a real file
    await fs.unlink(res.body.imageUrl);
  });

  
  it('should create a post without an image', async () => {
    const content = faker.lorem.sentence();

    const res = await api
      .post('/api/posts')
      .field('content', content)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(currentUser.data._id.toString());
    expect(res.body.content).toBe(content);;
    expect(res.body.imageUrl).not.toBeDefined();
    expect(res.body.likedBy).toEqual([]);
    expect(res.body.commentsCount).toBe(0);
  });


  it('should return 401 if not authenticated', async () => {
    const content = faker.lorem.sentence();
    const imageUrl = path.resolve(__dirname, '../images/test.jpg');

    const res = await api
      .post('/api/posts')
      .field('content', content) 
      .attach('image', imageUrl);

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if \'content\' is missing', async () => {
    const imageUrl = path.resolve(__dirname, '../images/test.jpg');

    const res = await api
      .post('/api/posts')
      .attach('image', imageUrl)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });


  it('should return 400 if \'content\' is too long', async () => {
    const longContent = faker.lorem.paragraphs(10);
    const imageUrl = path.resolve(__dirname, '../images/test.jpg');

    const res = await api
      .post('/api/posts')
      .field('content', longContent)
      .attach('image', imageUrl)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must be less than 100 characters');
  });


  it('should return 400 if \'content\' is an empty string', async () => {
    const imageUrl = path.resolve(__dirname, '../images/test.jpg');

    const res = await api
      .post('/api/posts')
      .field('content', '')
      .attach('image', imageUrl)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must not be empty');
  });
  
  
  it('should return 400 if \'image\' format is incorrect', async () => {
    const content = faker.lorem.sentence();
    const gifImageUrl = path.resolve(__dirname, '../images/test.gif');

    const res = await api
      .post('/api/posts')
      .field('content', content)
      .attach('image', gifImageUrl)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Image must be in PNG, JPG, or JPEG format');
  });


  it('should return 400 if more than one \'image\' is sent', async () => {
    const content = faker.lorem.sentence();
    const imageUrl = path.resolve(__dirname, '../images/test.jpg');
    const extraImageUrl = path.resolve(__dirname, '../images/test.png');

    const res = await api
      .post('/api/posts')
      .field('content', content)
      .attach('image', imageUrl)
      .attach('image', extraImageUrl)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Too many files');
  });
  

  it('should return 400 if \'image\' is too large', async () => {
    const content = faker.lorem.sentence();
    const largeImageUrl = path.resolve(__dirname, '../images/test-large.jpg');

    const res = await api
      .post('/api/posts')
      .field('content', content)
      .attach('image', largeImageUrl)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('File too large');
  });
});

describe('GET /api/posts/:id', () => {
  const currentUser = createAuthedUser();

  it('should fetch a single post', async () => {
    // Seed a post
    const post = await seedPost();

    // Fetch post
    const res = await api
      .get(`/api/posts/${ post._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(post._id.toString());
  });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .get(`/api/posts/${ invalidId }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const res = await api
      .get(`/api/posts/${ fakeIds[0] }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });
});

describe('PUT /api/posts/:id', () => {
  const currentUser = createAuthedUser();

  it('should like a post', async () => {
    // Seed a post
    const post = await seedPost();

    const res = await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).toContain(currentUser.data._id.toString());
  });


  it('should unlike a post', async () => {
    // Seed a post
    const post = await seedPost();

    // Like post
    await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', currentUser.cookie);

    // Unlike post
    const res = await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).not.toContain(currentUser.data._id.toString());
  });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .put(`/api/posts/${ fakeIds[0] }`);

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .put(`/api/posts/${ invalidId }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const res = await api
      .put(`/api/posts/${ fakeIds[0] }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 403 if user attempts to like own post', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

    const res = await api
      .put(`/api/posts/${ post._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You can\'t like your own post');
  });
});

describe('DELETE /api/posts/:id', () => {
  const currentUser = createAuthedUser();

  it('should delete a post', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

    const res = await api
      .delete(`/api/posts/${ post._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that post no longer exists in database
    const postDoc = await models.Post.findById(post._id).exec();

    expect(postDoc).toBeNull();
  });


  it('should delete associated comments', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

    // Seed comments
    for (let i = 0; i < 5; i++) {
      await seedComment({
        postedBy: currentUser.data._id,
        postId: post._id,
      });
    }

    // Delete post
    const res = await api
      .delete(`/api/posts/${ post._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(204);

    // Verify that these comments no longer exist in database
    const comments = await models.Comment.find({ postId: post._id }).exec();

    expect(comments).toHaveLength(0);
  });


  // it('should delete an associated image', async () => {

  // });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .delete(`/api/posts/${ fakeIds[0] }`)

    expect(res.statusCode).toBe(401);
  });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .delete(`/api/posts/${ invalidId }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const res = await api
      .delete(`/api/posts/${ fakeIds[0] }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 403 if user attempts to delete another user\'s post', async () => {
    // Seed a post
    const post = await seedPost();

    const res = await api
      .delete(`/api/posts/${ post._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You may only remove your own posts');
  });
});

// // A loop to simulate a chat in comments
// const userCount = users.length;

// for (let i = 0; i < 5; i++) {
//   const user = users[i % userCount];

//   const comment = new models.Comment({
//     postedBy: user.data._id,
//     postId: post._id,
//     content: data.comments[i].content,
//   });

//   await comment.save();
// }
