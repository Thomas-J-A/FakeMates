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

describe('GET /api/search', () => {
  let user;

  // Seed database
  beforeEach(async () => {
    // Seed a user
    const _user = new models.User({
      firstName: 'Marcus',
      lastName: 'Aurelius',
      email: 'marco@gmail.com',
      password: 'password',
    });

    await _user.save();
    
    user = { data: _user };
  });

  // Authenticate user
  beforeEach(async () => {
    const userInfo = {
      email: 'marco@gmail.com',
      password: 'password',
    };
    
    const res = await api
      .post('/api/auth/email')
      .send(userInfo);

    user.cookie = res.headers['set-cookie'][0];
  });

  it('should return a user when query matches full name', async () => {
    // Seed a second user
    const newUser = new models.User(data.users[0]);
    await newUser.save();

    const q = newUser.fullName;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(newUser._id.toString());
  });


  it('should return a user when query matches first name', async () => {
    // Seed a second user
    const newUser = new models.User(data.users[0]);
    await newUser.save();

    const q = newUser.firstName;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(newUser._id.toString());
  });


  it('should return a user when query matches last name', async () => {
    // Seed a second user
    const newUser = new models.User(data.users[0]);
    await newUser.save();

    const q = newUser.lastName;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(newUser._id.toString());
  });


  it('should return a user when query partially matches name', async () => {
    // Seed a second user (ensure first name is long enough for slice to work)
    const newUser = new models.User({ ...data.users[0], firstName: 'Epictetus' });
    await newUser.save();

    // Query with substring of first name
    const q = newUser.firstName.slice(2, 5);

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(newUser._id.toString());
  });


  it('should match users regardless of leading/trailing whitespace', async () => {
    // Seed a second user
    const newUser = new models.User(data.users[0]);
    await newUser.save();

    // Construct a query with whitespaces
    const q = ` ${ newUser.firstName } `;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(newUser._id.toString());
  });


  it('should respect whitespace inside query', async () => {
    // Seed a second user
    const newUser = new models.User({
      firstName: 'Musonius',
      lastName: 'Rufus',
      email: data.users[0].email,
      password: data.users[0].password,
    });

    await newUser.save();

    // Contruct a query which includes end of first name and beginning of last, including space
    const q = `${ newUser.firstName.slice(4) } ${ newUser.lastName.slice(0, 2) }`;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(newUser._id.toString());
  }); 


  it('should match users regardless of case', async () => {
    // Seed a second user
    const newUser = new models.User({ ...data.users[0], firstName: 'Seneca' });
    await newUser.save();

    // Substring of first name with random cases
    const q = 'eNeC';

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]._id).toBe(newUser._id.toString());
  });


  it('should fetch page one of results', async () => {
    // Seed enough users for two pages 
    for (let i = 0; i < 12; i++) {
      const _user = new models.User({ ...data.users[i], firstName: 'Socrates' });
      await _user.save();
    }

    const q = 'Socrates';

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(10);
    expect(res.body.hasMore).toBeTruthy();
  });


  it('should fetch page two of results', async () => {
    // Seed enough users for two pages 
    for (let i = 0; i < 12; i++) {
      const _user = new models.User({ ...data.users[i], firstName: 'Socrates' });
      await _user.save();
    }

    const q = 'Socrates';

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 2 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should only populate particular fields for each result', async () => {
     // Seed a second user
    const newUser = new models.User(data.users[0]);
    await newUser.save();

    const q = data.users[0].firstName;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users[0]).toHaveProperty('fullName');
    expect(res.body.users[0]).toHaveProperty('avatarUrl');
    expect(res.body.users[0]).not.toHaveProperty('email');
    expect(res.body.users[0]).not.toHaveProperty('location');
  });


  it('should return valid response if no matches exist', async () => {
    const q = faker.name.firstName();

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toEqual([]);
    expect(res.body.hasMore).toBeFalsy();
  });



  it('should not return a user when name doesn\'t contain the entire query', async () => {
    // Seed a second user
    const newUser = new models.User({ ...data.users[0], firstName: 'Rose' });
    await newUser.save();

    // Append to first name
    const q = `${ newUser.firstName }y`;

    // Search for that user
    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toEqual([]);
  });


  it('should return 400 if only whitespace is passed as the query', async () => {
    const query = ' ';

    const res = await api
      .get('/api/search')
      .query({ q: query })
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('q must not be empty');
  })


  it('should return 400 if q query parameter is missing', async () => {
    const res = await api
      .get('/api/search')
      .query({ page: 1 })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('q is required');
  });


  it('should return 400 if page query parameter is missing', async () => {
    const q = faker.name.firstName();

    const res = await api
      .get('/api/search')
      .query({ q })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page is required');
  });


  it('should return 400 if page is a negative number', async () => {
    const q = faker.name.firstName();
    const page = -1;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if page is zero', async () => {
    const q = faker.name.firstName();
    const page = 0;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if page is a floating point number', async () => {
    const q = faker.name.firstName();
    const page = 7.6;

    const res = await api
      .get('/api/search')
      .query({ q })
      .query({ page })
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be an integer');
  });
});
