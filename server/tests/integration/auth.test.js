const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const seeds = require('../seeds/index.seed');

// Creates a clearer syntax in requests
const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('POST /api/auth/email', () => {
  // Register a new user before each test
  beforeEach(async () => {
    await api
      .post('/api/auth/register')
      .send(seeds.users[0]);
      
    // await api
    //   .post('/api/auth/logout')
    //   .send();
  });

  it('should return 200 and JSON payload if successful', async () => {
    const { firstName, lastName, ...userLogin } = seeds.users[0];

    const res = await api
      .post('/api/auth/email')
      .send(userLogin);

    expect(res.statusCode).toBe(200);
    expect(res.body.currentUser).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
  });


  it('should set a JWT cookie if successful', async () => {
    const { firstName, lastName, ...userLogin } = seeds.users[0];

    const res = await api
      .post('/api/auth/email')
      .send(userLogin);
    
    expect(res.headers['set-cookie']).toBeDefined();
  });


  it('should return 401 and error message if email doesn\'t exist', async () => {
    const userLogin = {
      email: faker.internet.email(),
      password: seeds.users[0].password,
    };

    const res = await api
      .post('/api/auth/email')
      .send(userLogin);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Email doesn\'t exist');
  });


  it('should return 400 and error message if email is missing', async () => {
    const userWithMissingEmail = { password: seeds.users[0].password };

    const res = await api
      .post('/api/auth/email')
      .send(userWithMissingEmail);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email is required');
  });


  it('should return 400 and error message if email format is invalid', async () => {
    const userWithInvalidEmail = {
      email: 'name@domain',
      password: seeds.users[0].password,
    };

    const res = await api 
      .post('/api/auth/email')
      .send(userWithInvalidEmail);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid email');
  });


  it('should return 401 and error message if password is incorrect', async () => {
    const userLogin = {
      email: seeds.users[0].email,
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/email')
      .send(userLogin);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Incorrect password');
  });

  
  it('should return 400 and error message if password is missing', async () => {
    const userWithMissingPassword = { email: seeds.users[0].email };

    const res = await api
      .post('/api/auth/email')
      .send(userWithMissingPassword);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password is required');
  });
});

describe('POST /api/auth/register', () => {
  it('should return 201 and JSON payload if successful', async () => {
    const res = await api
      .post('/api/auth/register')
      .send(seeds.users[0]);

    expect(res.statusCode).toBe(201);
    expect(res.body.currentUser).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
  });


  it('should set a JWT cookie if successful', async () => {
    const res = await api
      .post('/api/auth/register')
      .send(seeds.users[0]);

    expect(res.headers['set-cookie']).toBeDefined();
  });


  it('should ignore input fields not defined in schema', async () => {
    const userWithInvalidFields = {
      ...seeds.users[0],
      favouriteColour: 'blue',
      favouriteNumber: 7,
    };

    const res = await api
      .post('/api/auth/register')
      .send(userWithInvalidFields);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.currentUser).toBeDefined();
    expect(res.body.currentUser.favouriteColour).not.toBeDefined();
    expect(res.body.currentUser.favouriteNumber).not.toBeDefined();
  });


  it('should return 409 and error message if email already exists', async () => {
    await api
      .post('/api/auth/register')
      .send(seeds.users[0]);

    const user2 = {
      ...seeds.users[1],
      email: seeds.users[0].email,
    };

    const res = await api
      .post('/api/auth/register')
      .send(user2);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Email already exists');
  });


  it('should return 400 and error message is email is missing', async () => {
    const { email, ...userWithMissingEmail } = seeds.users[0];

    const res = await api
      .post('/api/auth/register')
      .send(userWithMissingEmail);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email is required');
  });


  it('should return 400 and error message if email format is invalid', async () => {
    const userWithInvalidEmail = {
      ...seeds.users[0],
      email: 'name@doman'
    };

    const res = await api
      .post('/api/auth/register')
      .send(userWithInvalidEmail);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid email');
  });


  it('should return 400 and error message if first name is missing', async () => {
    const { firstName, ...userWithMissingFirstName } = seeds.users[0];

    const res = await api
      .post('/api/auth/register')
      .send(userWithMissingFirstName);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('First name is required');
  });


  it('should return 400 and error message if last name is missing', async () => {
    const { lastName, ...userWithMissingLastName } = seeds.users[0];

    const res = await api
      .post('/api/auth/register')
      .send(userWithMissingLastName);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Last name is required');
  });


  it('should return 400 and error message if password is missing', async () => {
    const { password, ...userWithMissingPassword } = seeds.users[0];

    const res = await api
      .post('/api/auth/register')
      .send(userWithMissingPassword);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password is required');
  });

  
  it('should return 400 and error message if password is too short', async () => {
    const userWithShortPassword = {
      ...seeds.users[0],
      password: 'abc'
    };

    const res = await api
      .post('/api/auth/register')
      .send(userWithShortPassword);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password must be at least 8 characters');
  });


  it('should return 400 and error message if password is too long', async () => {
    const userWithLongPassword = {
      ...seeds.users[0],
      password: 'abcdefghijklmnopqrstuvwxyz'
    };

    const res = await api
      .post('/api/auth/register')
      .send(userWithLongPassword);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password must be less than 20 characters');
  });


  // it('should not register a new user if user is currently signed in', async () => {
  //   await request(app)
  //     .post('/api/auth/register')
  //     .send(user);

  //   const user2 = {
  //     firstName: faker.name.firstName(),
  //     lastName: faker.name.lastName(),
  //     email: faker.internet.email(),
  //     password: faker.internet.password(),
  //   };

  //   const res = await request(app)
  //     .post('/api/auth/register')
  //     .send(user2);
  

  //   expect(res.statusCode).toBe(403);
  // });
});

describe('POST /api/auth/logout', () => {
  it('should clear JWT cookie', async () => {
     await api
      .post('/api/auth/register')
      .send(seeds.users[0]);

    const res = await api
      .post('/api/auth/logout')
      .send();

    expect(res.statusCode).toBe(204);
  });
});

// Use either async/await, or the done() callback for async tests
// Use either JEST's assertions, or supertest's assertions
