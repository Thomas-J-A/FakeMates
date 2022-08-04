const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const models = require('../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('POST /api/auth/email', () => {
  // Seed a user
  beforeEach(async () => {
    const user = new models.User({
      firstName: 'Marcus',
      lastName: 'Aurelius',
      email: 'marco@gmail.com',
      password: 'password',
    });

    await user.save();
  });

  it('should return 200 and JSON payload if successful', async () => {
    const res = await api
      .post('/api/auth/email')
      .send({
        email: 'marco@gmail.com',
        password: 'password',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('currentUser');
    expect(res.body).toHaveProperty('expiresAt');
  });


  it('should set a JWT cookie if successful', async () => {
    const res = await api
      .post('/api/auth/email')
      .send({
        email: 'marco@gmail.com',
        password: 'password',
      });
    
    expect(res.headers['set-cookie']).toBeDefined();
  });

  
  it('should mark user as online', async () => {
    const res = await api
      .post('/api/auth/email')
      .send({
        email: 'marco@gmail.com',
        password: 'password',
      });

    expect(res.body.currentUser.isOnline).toBeTruthy();
  });


  it('should populate some details about friends', async () => {
    // Seed a second user
    const user = new models.User({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    });

    await user.save();

    // Give first user a friend
    await models.User.findOneAndUpdate(
      { email: 'marco@gmail.com' },
      { $push: { friends: user._id }}
    ).exec();

    // Sign in first user
    const res = await api
      .post('/api/auth/email')
      .send({
        email: 'marco@gmail.com',
        password: 'password',
      });

    expect(res.body.currentUser.friends[0]).toHaveProperty('fullName');
    expect(res.body.currentUser.friends[0]).toHaveProperty('avatarUrl');
    expect(res.body.currentUser.friends[0]).not.toHaveProperty('email');
    expect(res.body.currentUser.friends[0]).not.toHaveProperty('location');
  });


  it('should return 401 if email doesn\'t exist', async () => {
    const res = await api
      .post('/api/auth/email')
      .send({
        email: faker.internet.email(),
        password: 'password',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Email doesn\'t exist');
  });


  it('should return 400 if \'email\' is missing', async () => {
    const res = await api
      .post('/api/auth/email')
      .send({
        password: 'password',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email is required');
  });


  it('should return 400 if \'email\' format is invalid', async () => {
    const res = await api 
      .post('/api/auth/email')
      .send({
        email: 'name@domain',
        password: 'password',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid email');
  });


  it('should return 400 if \'email\' is an empty string', async () => {
    const res = await api
      .post('/api/auth/email')
      .send({
        email: '',
        password: 'password',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email must not be empty');
  });


  it('should return 401 if \'password\' is incorrect', async () => {
    const res = await api
      .post('/api/auth/email')
      .send({
        email: 'marco@gmail.com',
        password: faker.internet.password(),
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Incorrect password');
  });

  
  it('should return 400 if \'password\' is missing', async () => {
    const res = await api
      .post('/api/auth/email')
      .send({
        email: 'marco@gmail.com',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password is required');
  });


  it('should return 400 if \'password\' is an empty string', async () => {
    const res = await api
      .post('/api/auth/email')
      .send({
        email: 'marco@gmail.com',
        password: '',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password must not be empty');
  });
});

describe('POST /api/auth/register', () => {
  it('should return 201 and JSON payload if successful', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('currentUser');
    expect(res.body).toHaveProperty('expiresAt');
  });


  it('should set a JWT cookie if successful', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.headers['set-cookie']).toBeDefined();
  });


  it('should ignore input fields not defined in schema', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      favouriteColour: 'blue',
      favouriteNumber: 7,
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('currentUser');
    expect(res.body).toHaveProperty('expiresAt');
    expect(res.body).not.toHaveProperty('favouriteColour');
    expect(res.body).not.toHaveProperty('favouriteNumber');
  });


  it('should populate fullName field', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(201);
    expect(res.body.currentUser).toHaveProperty('fullName');
  })


  it('should return 409 if email already exists', async () => {
    // Seed a user
    const user = new models.User({
      firstName: 'Marcus',
      lastName: 'Aurelius',
      email: 'marco@gmail.com',
      password: 'password',
    });

    await user.save();

    // Create a second user with same email address
    const user2 = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: 'marco@gmail.com',
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(user2);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Email already exists');
  });


  it('should return 400 if \'email\' is missing', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email is required');
  });


  it('should return 400 if \'email\' format is invalid', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: 'name@doman',
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid email');
  });


  it('should return 400 if \'email\' is an empty string', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: '',
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email must not be empty');
  });


  it('should return 400 if \'firstName\' is missing', async () => {
    const userInfo = {
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('First name is required');
  });


  it('should return 400 if \'firstName\' is an empty string', async () => {
    const userInfo = {
      firstName: '',
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('First name must not be empty');
  });


  it('should return 400 if \'lastName\' is missing', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Last name is required');
  });


  it('should return 400 if \'lastName\' is an empty string', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: '',
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Last name must not be empty');
  });


  it('should return 400 if \'password\' is missing', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password is required');
  });

  
  it('should return 400 if \'password\' is too short', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: 'abc',
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password must be at least 8 characters');
  });


  it('should return 400 if \'password\' is too long', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: 'abcdefghijklmnopqrstuvwxyz',
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password must be less than 20 characters');
  });


  it('should return 400 if \'password\' is an empty string', async () => {
    const userInfo = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: '',
    };

    const res = await api
      .post('/api/auth/register')
      .send(userInfo);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password must not be empty');
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
    const res = await api
      .post('/api/auth/logout')
      .send();

    expect(res.statusCode).toBe(204);
  });
});

// Use either async/await, or the done() callback for async tests
// Use either JEST's assertions, or supertest's assertions
