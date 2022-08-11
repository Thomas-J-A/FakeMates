const supertest = require('supertest');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedUser, seedPost } = require('../utils/seeds.util');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/timeline', () => {
  const currentUser = createAuthedUser();

  it('should return a post created by current user', async () => {
    // Seed a post
    await seedPost({ postedBy: currentUser.data._id });

    const res = await api
      .get('/api/timeline')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].postedBy._id).toBe(currentUser.data._id.toString());
  });


  it('should return a post created by a friend of current user', async () => {
    // Add a second user as a friend
    const friend = await seedUser();

    currentUser.data.friends.push(friend._id);
    await currentUser.data.save();

    // Create post with second user
    await seedPost({ postedBy: friend._id });

    const res = await api
      .get('/api/timeline')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].postedBy._id).toBe(friend._id.toString());
  });


  it('should populate some details about post author', async () => {
    // Seed a post
    await seedPost({ postedBy: currentUser.data._id });

    const res = await api
      .get('/api/timeline')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts[0].postedBy).toHaveProperty('fullName');
    expect(res.body.posts[0].postedBy).toHaveProperty('avatarUrl');
    expect(res.body.posts[0].postedBy).not.toHaveProperty('email');
    expect(res.body.posts[0].postedBy).not.toHaveProperty('location');
  });


  it('should paginate results and let client know if there are more', async () => {
    // Seed enough posts for two pages 
    for (let i = 0; i < 12; i++) {
      await seedPost({ postedBy: currentUser.data._id });
    }

    // Fetch page one
    const res = await api
      .get('/api/timeline')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toHaveLength(10);
    expect(res.body.hasMore).toBeTruthy();

    // Fetch page two
    const res2 = await api
      .get('/api/timeline')
      .query({ page: 2 })
      .set('Cookie', currentUser.cookie);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.posts).toHaveLength(2);
    expect(res2.body.hasMore).toBeFalsy();
  });


  it('should return latest posts first', async () => {
    // Seed posts
    for (let i = 0; i < 2; i++) {
      await seedPost({ postedBy: currentUser.data._id });
    };

    const res = await api
      .get('/api/timeline')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);
      
    expect(res.statusCode).toBe(200);

    // Parse the ISO formatted createdAt value into a UNIX timestamp
    const timestamp1 = Date.parse(res.body.posts[0].createdAt);
    const timestamp2 = Date.parse(res.body.posts[1].createdAt);

    expect(timestamp1).toBeGreaterThan(timestamp2);
  });


  it('should return valid response if no posts exist', async () => {
    const res = await api
      .get('/api/timeline')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.posts).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });
});

// All tests related to an invalid/missing page query parameter
// can be found in other test files which also require pagination
// with the exact same validation
