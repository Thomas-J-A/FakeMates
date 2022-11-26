const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedUser, seedPost, seedComment } = require('../utils/seeds.util');
const fakeIds = require('../utils/fakeIds.util');
const models = require('../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/comments', () => {
  const currentUser = createAuthedUser();

  it('should paginate results and let client know if there are more', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

    // Seed enough comments for two pages
    for (let i = 0; i < 7; i++) {
      await seedComment({
        postedBy: currentUser.data._id,
        postId: post._id,
      });
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
    expect(res.body.resultsRemaining).toBe(2);

    // Fetch page two
    const res2 = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 2 })
      .set('Cookie', currentUser.cookie);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.comments).toHaveLength(2);
    expect(res2.body.hasMore).toBeFalsy();
    expect(res2.body.resultsRemaining).toBe(0);
  });


  it('should fetch comments for a post created by a friend', async () => {
    // Seed a second user
    const user = await seedUser({ friends: [currentUser.data._id ] });

    // Add user to current user's friends
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

    // Seed a post created by second user
    const post = await seedPost({ postedBy: user._id });

    // Seed a comment
    const comment = await seedComment({
      postedBy: user._id,
      postId: post._id,
    });

    // Fetch comment
    const res = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0]._id).toBe(comment._id.toString());
  });


  it('should fetch comments for a post belonging to a public account', async () => {
    // Seed a second user with a public account
    const user = await seedUser({ isPrivate: 'false' });

    // Seed a post created by second user
    const post = await seedPost({ postedBy: user._id });

    // Seed a comment
    const comment = await seedComment({
      postedBy: user._id,
      postId: post._id,
    });

    // Fetch comment
    const res = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0]._id).toBe(comment._id.toString());
  });


  it('should populate some details about comment author', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

    // Seed a comment
    await seedComment({
      postedBy: currentUser.data._id,
      postId: post._id,
    });

    // Fetch comments
    const res = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments[0].postedBy).toHaveProperty('fullName');
    expect(res.body.comments[0].postedBy).toHaveProperty('avatarUrl');
    expect(res.body.comments[0].postedBy).toHaveProperty('isPrivate');
    expect(res.body.comments[0].postedBy).not.toHaveProperty('email');
    expect(res.body.comments[0].postedBy).not.toHaveProperty('location');
  });


  it('should return oldest comments first', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

    // Seed comments
    for (let i = 0; i < 2; i++) {
      await seedComment({
        postedBy: currentUser.data._id,
        postId: post._id,
      });
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

    expect(timestamp1).toBeLessThan(timestamp2);
  });


  it('should return valid response if no comments are available', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

    const res = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
    expect(res.body.resultsRemaining).toBe(0);
  });


  it('should return 403 if comments belong to a private post and users aren\'t friends', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a post created by second user
    const post = await seedPost({ postedBy: user._id });

    // Seed a comment
    const comment = await seedComment({
      postedBy: user._id,
      postId: post._id,
    });

    // Fetch comment
    const res = await api
      .get('/api/comments')
      .query({ postid: post._id.toString() })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You can\'t view these comments');
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
      .query({ postid: fakeIds[0] })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 400 if \'page\' is missing', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: fakeIds[0] })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page is required');
  });


  it('should return 400 if \'page\' is a negative number', async () => {
    const page = -1;

    const res = await api
      .get('/api/comments')
      .query({ postid: fakeIds[0] })
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });

  
  it('should return 400 if \'page\' is zero', async () => {
    const page = 0;

    const res = await api
    .get('/api/comments')
    .query({ postid: fakeIds[0] })
    .query({ page })
    .set('Cookie', currentUser.cookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if \'page\' is a floating point number', async () => {
    const page = 2.4;

    const res = await api
      .get('/api/comments')
      .query({ postid: fakeIds[0] })
      .query({ page })
      .set('Cookie', currentUser.cookie);
  
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be an integer');
  });


  it('should return 400 if \'page\' is not a number', async () => {
    const page = faker.lorem.word();

    const res = await api
      .get('/api/comments')
      .query({ postid: fakeIds[0] })
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be a number');
  });
});

describe('POST /api/comments', () => {
  const currentUser = createAuthedUser();

  it('should create a comment on own post', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

    // Create a comment
    const content = faker.lorem.sentence();

    const res = await api
      .post('/api/comments')
      .query({ postid: post._id.toString() })
      .set('Cookie', currentUser.cookie)
      .send({ content });

    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy._id).toBe(currentUser.data._id.toString());
    expect(res.body.postId).toBe(post._id.toString());
    expect(res.body.content).toBe(content);
    expect(res.body.likedBy).toEqual([]);
  });


  it('should create a comment on a friend\'s post', async () => {
    // Seed a second user, with current user as a friend
    const user = await seedUser({ friends: [currentUser.data._id] });

    // Add user to current user's friends
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

    // Seed a post, created by second user
    const post = await seedPost({ postedBy: user._id });

    // Create a comment on friend's post
    const content = faker.lorem.sentence();

    const res = await api
      .post('/api/comments')
      .query({ postid: post._id.toString() })
      .set('Cookie', currentUser.cookie)
      .send({ content });

    expect(res.statusCode).toBe(201);
  });


  it('should update commentsCount field in corresponding post', async () => {
    // Seed a post
    const post = await seedPost({ postedBy: currentUser.data._id });

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


  it('should return 403 if post belongs to a public account and users are not friends', async () => {
    // Seed a second user with a public account
    const user = await seedUser({ isPrivate: 'false' });

    // Seed a post, created by second user
    const post = await seedPost({ postedBy: user._id });

    // Create a comment
    const content = faker.lorem.sentence();

    const res = await api
      .post('/api/comments')
      .query({ postid: post._id.toString() })
      .set('Cookie', currentUser.cookie)
      .send({ content });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You cannot comment on this post');
  });


  it('should return 403 if post belongs to a private account and users are not friends', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a post, created by second user
    const post = await seedPost({ postedBy: user._id });

    // Create a comment
    const content = faker.lorem.sentence();

    const res = await api
      .post('/api/comments')
      .query({ postid: post._id.toString() })
      .set('Cookie', currentUser.cookie)
      .send({ content });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You cannot comment on this post');
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
      .query({ postid: fakeIds[0] })
      .set('Cookie', currentUser.cookie)
      .send({ content: faker.lorem.sentence() });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 400 if \'content\' is longer than 100 characters', async () => {
    const longContent = faker.lorem.paragraphs(10);

    const res = await api
      .post('/api/comments')
      .query({ postid: fakeIds[0] })
      .set('Cookie', currentUser.cookie)
      .send({ content: longContent });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must be less than 100 characters');
  });


  it('should return 400 if \'content\' is missing', async () => {
    const res = await api
      .post('/api/comments')
      .query({ postid: fakeIds[0] })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });


  it('should return 400 if \'content\' is an empty string', async () => {
    const res = await api
      .post('/api/comments')
      .query({ postid: fakeIds[0] })
      .set('Cookie', currentUser.cookie)
      .send({ content: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must not be empty');
  });
});

describe('PUT /api/comments/:id', () => {
  const currentUser = createAuthedUser();

  it('should like someone\'s comment on own post', async () => {
    // Seed a second user with current user as a friend
    const user = await seedUser({ friends: [currentUser.data._id ]});

    // Add user to current user's friends
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

    // Seed a post, created by current user
    const post = await seedPost({ postedBy: currentUser.data._id });

    // Seed a comment, created by second user
    const comment = await seedComment({
      postedBy: user._id,
      postId: post._id,
    });

    // Like comment
    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).toContain(currentUser.data._id.toString());
  });


  it('should like someone\'s comment on a friend\'s post', async () => {
    // Seed a second user with current user as a friend
    const user = await seedUser({ friends: [currentUser.data._id] });

    // Add user to current user's friends
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

    // Seed a post, created by second user
    const post = await seedPost({ postedBy: user._id });

    // Seed a comment, created by second user
    const comment = await seedComment({
      postedBy: user._id,
      postId: post._id,
    });

    // Like comment
    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).toContain(currentUser.data._id.toString());
  });


  it('should like someone\'s comment on a post belonging to a public account', async () => {
    // Seed a second user with a public account
    const user = await seedUser({ isPrivate: 'false' });

    // Seed a post, created by second user
    const post = await seedPost({ postedBy: user._id });

    // Seed a comment, created by second user
    const comment = await seedComment({
      postedBy: user._id,
      postId: post._id,
    });

    // Like comment
    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).toContain(currentUser.data._id.toString());
  });


  it('should unlike a comment (on own post)', async () => {
    // Seed a second user with current user as a friend
    const user = await seedUser({ friends: [currentUser.data._id ]});

    // Add user to current user's friends
    await models.User.findByIdAndUpdate(currentUser.data._id, {
      $push: { friends: user._id },
    }).exec();

    // Seed a post, created by current user
    const post = await seedPost({ postedBy: currentUser.data._id });

    // Seed a comment, created by second user, liked by current user
    const comment = await seedComment({
      postedBy: user._id,
      postId: post._id,
      likedBy: [currentUser.data._id],
    });

    // Unlike comment
    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).not.toContain(currentUser.data._id.toString());
  });


  it('should return 403 if user attempts to like own comment', async () => {
    // Seed a comment
    const comment = await seedComment({ postedBy: currentUser.data._id });

    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You can\'t like your own comment');
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
      .put(`/api/comments/${ fakeIds[0] }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Comment doesn\'t exist');
  });
});
