const supertest = require('supertest');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const models = require('../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

const fakeUserId = new mongoose.Types.ObjectId().toString();
const fakePostId = new mongoose.Types.ObjectId().toString();
const fakeCommentId = new mongoose.Types.ObjectId().toString();

describe('GET /api/comments', () => {
  const currentUser = createAuthedUser();
  
  // Seed a post
  let post;
  
  beforeEach(async () => {
    post = new models.Post({
      postedBy: currentUser.data._id,
      content: faker.lorem.sentence(),
    });
    
    await post.save();
  })

  it('should paginate results and let client know if there are more', async () => {
    // Seed enough comments for two pages
    for (let i = 0; i < 7; i++) {
      const comment = new models.Comment({
        postedBy: currentUser.data._id,
        postId: post._id,
        content: faker.lorem.sentence(),
      });
      
      await comment.save();
    }

    // Fetch page one
    const res = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(5);
    expect(res.body.hasMore).toBeTruthy();

    // Fetch page two
    const res2 = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 2 })
      .set('Cookie', currentUser.cookie);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.comments).toHaveLength(2);
    expect(res2.body.hasMore).toBeFalsy();
  });

  // it('should let client know if there are no more comments', async () => {

  // });


  // it('should return 400 if page number is too high', async () => {

  // });


  it('should populate some details about comment author', async () => {
    // Seed a comment
    const comment = new models.Comment({
      postedBy: currentUser.data._id,
      postId: post._id,
      content: faker.lorem.sentence(),
    });
    
    await comment.save();

    // Fetch comments
    const res = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments[0].postedBy).toHaveProperty('fullName');
    expect(res.body.comments[0].postedBy).toHaveProperty('avatarUrl');
    expect(res.body.comments[0].postedBy).not.toHaveProperty('email');
    expect(res.body.comments[0].postedBy).not.toHaveProperty('location');
  });


  it('should return latest comments first', async () => {
    // Seed comments
    for (let i = 0; i < 2; i++) {
      const comment = new models.Comment({
        postedBy: currentUser.data._id,
        postId: post._id,
        content: faker.lorem.sentence(),
      });
      
      await comment.save();
    }

    // Fetch comments
    const res = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);

    // Parse the ISO formatted createdAt value into a UNIX timestamp
    const timestamp1 = Date.parse(res.body.comments[0].createdAt);
    const timestamp2 = Date.parse(res.body.comments[1].createdAt);

    expect(timestamp1).toBeGreaterThan(timestamp2);
  });


  it('should return valid response if no comments are available', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should return 400 if \'postid\' is missing', async () => {
    const res = await api
      .get('/api/comments')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post ID is required');
  });


  it('should return 400 if \'postid\' isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123';

    const res = await api
      .get('/api/comments')
      .query({ postid: invalidId })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post ID must be a valid ObjectId');
  });


  it('should return 400 if \'postid\' is an empty string', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: '' })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post ID must not be empty');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: fakePostId })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 400 if \'page\' is missing', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: fakePostId })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page is required');
  });


  it('should return 400 if \'page\' is a negative number', async () => {
    const page = -1;

    const res = await api
      .get('/api/comments')
      .query({ postid: fakePostId })
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });

  
  it('should return 400 if \'page\' is zero', async () => {
    const page = 0;

    const res = await api
    .get('/api/comments')
    .query({ postid: fakePostId })
    .query({ page })
    .set('Cookie', currentUser.cookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if \'page\' is a floating point number', async () => {
    const page = 2.4;

    const res = await api
      .get('/api/comments')
      .query({ postid: fakePostId })
      .query({ page })
      .set('Cookie', currentUser.cookie);
  
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be an integer');
  });


  it('should return 400 if \'page\' is not a number', async () => {
    const page = faker.lorem.word();

    const res = await api
      .get('/api/comments')
      .query({ postid: fakePostId })
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be a number');
  });
});

describe('POST /api/comments', () => {
  const currentUser = createAuthedUser();

  it('should create a comment', async () => {
    // Seed a post
    const post = new models.Post({
      postedBy: currentUser.data._id,
      content: faker.lorem.sentence(),
    });

    await post.save();

    // Create a comment
    const content = faker.lorem.sentence();

    const res = await api
      .post('/api/comments')
      .query({ postid: post._id.toString() })
      .set('Cookie', currentUser.cookie)
      .send({ content });

    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(currentUser.data._id.toString());
    expect(res.body.postId).toBe(post._id.toString());
    expect(res.body.content).toBe(content);
    expect(res.body.likedBy).toEqual([]);
  });


  it('should update commentsCount field in corresponding post', async () => {
    // Seed a post
    const post = new models.Post({
      postedBy: currentUser.data._id,
      content: faker.lorem.sentence(),
    });

    await post.save();

    // Create a comment
    const content = faker.lorem.sentence();

    const res = await api
      .post('/api/comments')
      .query({ postid: post._id.toString() })
      .set('Cookie', currentUser.cookie)
      .send({ content });

    expect(res.statusCode).toBe(201);

    // Verify that commentsCount now has value of one
    const postDoc = await models.Post.findById(post._id).exec();

    expect(postDoc.commentsCount).toBe(1);
  });


  it('should return 400 if \'postid\' is missing', async () => {
    const res = await api
      .post('/api/comments')
      .set('Cookie', currentUser.cookie)
      .send({ content: faker.lorem.sentence() });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post ID is required');
  });


  it('should return 400 if \'postid\' isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123';

    const res = await api
      .post('/api/comments')
      .query({ postid: invalidId })
      .set('Cookie', currentUser.cookie)
      .send({ content: faker.lorem.sentence() });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post ID must be a valid ObjectId');
  });


  it('should return 400 if \'postid\' is an empty string', async () => {
    const res = await api
      .post('/api/comments')
      .query({ postid: '' })
      .set('Cookie', currentUser.cookie)
      .send({ content: faker.lorem.sentence() });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post ID must not be empty');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const res = await api
      .post('/api/comments')
      .query({ postid: fakePostId })
      .set('Cookie', currentUser.cookie)
      .send({ content: faker.lorem.sentence() });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 400 if \'content\' is longer than 100 characters', async () => {
    const longContent = faker.lorem.paragraphs(10);

    const res = await api
      .post('/api/comments')
      .query({ postid: fakePostId })
      .set('Cookie', currentUser.cookie)
      .send({ content: longContent });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must be less than 100 characters');
  });


  it('should return 400 if \'content\' is missing', async () => {
    const res = await api
      .post('/api/comments')
      .query({ postid: fakePostId })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });


  it('should return 400 if \'content\' is an empty string', async () => {
    const res = await api
      .post('/api/comments')
      .query({ postid: fakePostId })
      .set('Cookie', currentUser.cookie)
      .send({ content: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must not be empty');
  });
});

describe('PUT /api/comments/:id', () => {
  const currentUser = createAuthedUser();

  it('should like a comment', async () => {
    // Seed a comment
    const comment = new models.Comment({
      postedBy: fakeUserId,
      postId: fakePostId,
      content: faker.lorem.sentence(),
    });

    await comment.save();

    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).toContain(currentUser.data._id.toString());
  });


  it('should unlike a comment', async () => {
    // Seed a comment
    const comment = new models.Comment({
      postedBy: fakeUserId,
      postId: fakePostId,
      content: faker.lorem.sentence(),
    });

    await comment.save();

    // Like comment
    await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', currentUser.cookie);

    // Unlike comment
    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).not.toContain(currentUser.data._id.toString());
  });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .put(`/api/comments/${ invalidId }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if comment doesn\'t exist', async () => {
    const res = await api
      .put(`/api/comments/${ fakeCommentId }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Comment doesn\'t exist');
  });


  it('should return 403 if user attempts to like own comment', async () => {
    // Seed a comment
    const comment = new models.Comment({
      postedBy: currentUser.data._id,
      postId: fakePostId,
      content: faker.lorem.sentence(),
    });

    await comment.save();

    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You can\'t like your own comment');
  });
});
