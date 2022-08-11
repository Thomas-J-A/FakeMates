const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedFriendRequest, seedUser } = require('../utils/seeds.util');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/search', () => {
  const currentUser = createAuthedUser();

  it('should return a user when query matches full name', async () => {
    // Seed a second user
    const user = await seedUser();

    const q = user.fullName;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(user._id.toString());
  });


  it('should return a user when query matches first name', async () => {
    // Seed a second user
    const user = await seedUser();

    const q = user.firstName;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(user._id.toString());
  });


  it('should return a user when query matches last name', async () => {
    // Seed a second user
    const user = await seedUser();

    const q = user.lastName;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(user._id.toString());
  });


  it('should return a user when query partially matches name', async () => {
    // Seed a second user (ensure first name is long enough for slice to work)
    const user = await seedUser({ firstName: 'Epictetus' });

    // Query with substring of first name
    const q = user.firstName.slice(2, 5);

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(user._id.toString());
  });


  it('should match users regardless of leading/trailing whitespace', async () => {
    // Seed a second user
    const user = await seedUser();

    // Construct a query with whitespace
    const q = ` ${ user.firstName } `;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(user._id.toString());
  });


  it('should respect whitespace inside query', async () => {
    // Seed a second user
    const user = await seedUser({
      firstName: 'Musonius',
      lastName: 'Rufus',
    });

    // Contruct a query which includes end of first name
    // and beginning of last, including the space
    const q = `${ user.firstName.slice(4) } ${ user.lastName.slice(0, 2) }`;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(user._id.toString());
  }); 


  it('should match users regardless of case', async () => {
    // Seed a second user
    const user = await seedUser({ firstName: 'Seneca' });

    // Substring of first name with random case
    const q = 'eNeC';

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(user._id.toString());
  });


  it('should paginate results and let client know if there are more', async () => {
    // Seed enough users for two pages 
    for (let i = 0; i < 12; i++) {
      await seedUser({ firstName: 'Socrates' });
    }

    const q = 'Socrates';

    // Fetch page one
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(10);
    expect(res.body.hasMore).toBeTruthy();

    // Fetch page two
    const res2 = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 2 })
      .set('Cookie', currentUser.cookie);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.users).toHaveLength(2);
    expect(res2.body.hasMore).toBeFalsy();
  });


  it('should only populate particular fields for each result', async () => {
    // Search for self
    const q = currentUser.data.firstName;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users[0]).toHaveProperty('fullName');
    expect(res.body.users[0]).toHaveProperty('avatarUrl');
    expect(res.body.users[0]).toHaveProperty('relationshipStatus');
    expect(res.body.users[0]).not.toHaveProperty('email');
    expect(res.body.users[0]).not.toHaveProperty('location');
  });


  it('should return relationship status of \'pending\' if there is a pending request', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a pending friend request
    await seedFriendRequest({
      from: currentUser.data._id,
      to: user._id,
    });

    // Search for second user
    const res = await api
      .get('/api/search')
      .query({ q: user.firstName })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users[0].relationshipStatus).toBe('pending');
  });


  it('should return relationship status of \'accepted\' if users are friends', async () => {
     // Seed a second user
     const user = await seedUser();

    // Seed an accepted friend request
    await seedFriendRequest({
      from: currentUser.data._id,
      to: user._id,
      status: 2,
    });

    // Search for second user
    const res = await api
      .get('/api/search')
      .query({ q: user.firstName })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users[0].relationshipStatus).toBe('accepted');
  });


  it('should return relationship status of \'rejected\' if there is a rejected request', async () => {
    // Seed a second user
    const user = await seedUser();

    // Seed a rejected friend request
    await seedFriendRequest({
      from: currentUser.data._id,
      to: user._id,
      status: 3,
    });

    // Search for second user
    const res = await api
      .get('/api/search')
      .query({ q: user.firstName })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users[0].relationshipStatus).toBe('rejected');
  });


  it('should return relationship status of \'oneself\' if current user requests themselves', async () => {
    // Search for oneself
    const res = await api
      .get('/api/search')
      .query({ q: currentUser.data.fullName })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users[0].relationshipStatus).toBe('oneself');
  });


  it('should return relationship status of \'none\' if users are strangers', async () => {
    // Seed a second user
    const user = await seedUser();

    // Search for second user
    const res = await api
      .get('/api/search')
      .query({ q: user.firstName })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users[0].relationshipStatus).toBe('none');
  });


  it('should return valid response if no matches exist', async () => {
    const q = faker.name.firstName();

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should not return a user when name doesn\'t contain the entire query', async () => {
    // Seed a second user
    const user = await seedUser({ firstName: 'Rose' });

    // Append to first name
    const q = `${ user.firstName }y`;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(0);
  });


  it('should return 400 if only whitespace is passed as the query', async () => {
    const q = ' ';

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Query must not be empty');
  });


  it('should return 400 if \'q\' is missing', async () => {
    const res = await api
      .get('/api/search')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Query is required');
  });


  it('should return 400 if \'q\' is an empty string', async () => {
    const q = '';

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Query must not be empty');
  });


  it('should return 400 if \'page\' is missing', async () => {
    const q = faker.name.firstName();

    const res = await api
      .get('/api/search')
      .query({ q })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page is required');
  });


  it('should return 400 if \'page\' is a negative number', async () => {
    const q = faker.name.firstName();
    const page = -1;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if \'page\' is zero', async () => {
    const q = faker.name.firstName();
    const page = 0;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if \'page\' is a floating point number', async () => {
    const q = faker.name.firstName();
    const page = 7.6;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be an integer');
  });


  it('should return 400 if \'page\' is not a number', async () => {
    const q = faker.name.firstName();
    const page = faker.lorem.word();

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be a number');
  });
});
