const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../../src/app');
const dbUtil = require('../../utils/db.util');
const data = require('../data/index.data');
const models = require('../../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/comments', () => {
  let users = [];
  let posts = [];

  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 3; i++) {
      const _user = new models.User(data.users[i]);
      await _user.save();
      
      users.push({ data: _user });
    }

    // Seed posts
    for (let i = 0; i < 2; i++) {
      const _post = new models.Post({
        postedBy: users[0].data._id,
        content: data.posts[i].content,
      });
      
      await _post.save();
      posts.push(_post);
    };
    
    // Seed comments
    const userCount = users.length;
    
    for (let i = 0; i < 8; i++) {
      // Cycle through users to simulate a chat in comments
      const _user = users[i % userCount];
      
      const _comment = new models.Comment({
        postedBy: _user.data._id,
        postId: posts[0]._id,
        content: data.comments[i].content,
      });
      
      await _comment.save();
    }
  });

  // Authenticate users
  beforeEach(async () => {
    for (let i = 0; i < 3; i++) {
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
    users = [];
    posts = [];
  });

  it('should fetch page one of comments', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: posts[0]._id.toString() })
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(5);
    expect(res.body.hasMore).toBeTruthy();
  });


  it('should fetch page two of comments', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: posts[0]._id.toString() })
      .query({ page : 2 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(3);
    expect(res.body.hasMore).toBeFalsy();
  });


  // it('should let client know if there are no more comments', async () => {

  // });


  // it('should return 400 if page number is too high', async () => {

  // });


  it('should populate some details about comment author', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: posts[0]._id.toString() })
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments[0].postedBy).toHaveProperty('fullName');
    expect(res.body.comments[0].postedBy).toHaveProperty('avatarUrl');
    expect(res.body.comments[0].postedBy).not.toHaveProperty('email');
    expect(res.body.comments[0].postedBy).not.toHaveProperty('location');
  });


  it('should return latest comments first', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: posts[0]._id.toString() })
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    // Parse the ISO formatted createdAt value into a UNIX timestamp
    const timestamp1 = Date.parse(res.body.comments[0].createdAt);
    const timestamp2 = Date.parse(res.body.comments[1].createdAt);

    expect(res.statusCode).toBe(200);
    expect(timestamp1).toBeGreaterThan(timestamp2);
  });


  it('should return valid response if no comments are available', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: posts[1]._id.toString() })
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should return 400 if postid query parameter is missing', async () => {
    const res = await api
      .get('/api/comments')
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('postid is required');
  });


  it('should return 400 if postid isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123';

    const res = await api
      .get('/api/comments')
      .query({ postid: invalidId })
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('postid must be a valid ObjectId');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .get('/api/comments')
      .query({ postid: fakeId })
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 400 if page query parameter is missing', async () => {
    const res = await api
      .get('/api/comments')
      .query({ postid: posts[0]._id.toString() })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page is required');
  });


  it('should return 400 if page is a negative number', async () => {
    const page = -1;

    const res = await api
      .get('/api/comments')
      .query({ postid: posts[0]._id.toString() })
      .query({ page })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });

  
  it('should return 400 if page is zero', async () => {
    const page = 0;

    const res = await api
    .get('/api/comments')
    .query({ postid: posts[0]._id.toString() })
    .query({ page })
    .set('Cookie', users[0].cookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if page is a floating point number', async () => {
    const page = 2.4;

    const res = await api
      .get('/api/comments')
      .query({ postid: posts[0]._id.toString() })
      .query({ page })
      .set('Cookie', users[0].cookie);
  
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be an integer');
  });
});

describe('POST /api/comments', () => {
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
  })

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

  it('should create a comment', async () => {
    const res = await api
      .post('/api/comments')
      .query({ postid: post._id.toString() })
      .set('Cookie', users[1].cookie)
      .send(data.comments[0]);

    expect(res.statusCode).toBe(201);
    expect(res.body.postedBy).toBe(users[1].data._id.toString());
    expect(res.body.postId).toBe(post._id.toString());
    expect(res.body.content).toBe(data.comments[0].content);
    expect(res.body.likedBy).toEqual([]);
  });


  it('should update commentsCount field in corresponding post', async () => {
    // TODO: implement this test after creating route for fetching a single post
    // that gets called whenever someone clicks on a link in a notification
    // GET /api/posts/:id ?
  });


  it('should return 400 if postid query parameter is missing', async () => {
    const res = await api
      .post('/api/comments')
      .set('Cookie', users[1].cookie)
      .send(data.comments[0]);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('postid is required');
  });


  it('should return 400 if postid isn\'t a valid ObjectId', async () => {
    const invalidId = 'abc123';

    const res = await api
      .post('/api/comments')
      .query({ postid: invalidId })
      .set('Cookie', users[1].cookie)
      .send(data.comments[0]);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('postid must be a valid ObjectId');
  });


  it('should return 400 if post doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .post('/api/comments')
      .query({ postid: fakeId })
      .set('Cookie', users[1].cookie)
      .send(data.comments[0]);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Post doesn\'t exist');
  });


  it('should return 400 if content is longer than 100 characters', async () => {
    const longContent = faker.lorem.paragraphs(10);

    const res = await api
      .post('/api/comments')
      .query({ postid: post._id.toString() })
      .set('Cookie', users[1].cookie)
      .send({ content: longContent });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content must be less than 100 characters');
  });


  it('should return 400 if content is missing', async () => {
    const res = await api
      .post('/api/comments')
      .query({ postid: post._id.toString() })
      .set('Cookie', users[1].cookie)
      .send()

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Content is required');
  });
});

describe('PUT /api/comments/:id', () => {
  let users = [];
  let post;
  let comment;

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

    // Seed a comment
    const _comment = new models.Comment({
      postedBy: users[1].data._id,
      postId: post._id,
      content: data.comments[0].content,
    });

    await _comment.save();
    comment = _comment;
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

  it('should like a comment', async () => {
    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).toContain(users[0].data._id.toString());
  });


  it('should unlike a comment', async () => {
    // Like comment
    await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', users[0].cookie);

    // Unlike comment
    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.likedBy).not.toContain(users[0].data._id.toString());
  });


  it('should return 400 if :id param is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .put(`/api/comments/${ invalidId }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('id must be a valid ObjectId');
  });


  it('should return 400 if comment doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .put(`/api/comments/${ fakeId }`)
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Comment doesn\'t exist');
  });


  it('should return 403 if user attempts to like own comment', async () => {
    const res = await api
      .put(`/api/comments/${ comment._id }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You can\'t like your own comment');
  });
});
