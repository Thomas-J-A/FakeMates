const supertest = require('supertest');

const app = require('../../../src/app');
const dbUtil = require('../../utils/db.util');
const data = require('../data/index.data');
const models = require('../../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/advertisements', () => {
  let user;

  // Seed database
  beforeEach(async () => {
    // Seed a user
    const _user = new models.User(data.users[0]);
    await _user.save();
    
    user = { date: _user };
    
    // Seed ads
    for (let i = 0; i < 3; i++) {
      const _ad = new models.Advertisement(data.advertisements[i]);
      await _ad.save();
    }
  });

  // Authenticate user
  beforeEach(async () => {
    const userInfo = {
      email: data.users[0].email,
      password: data.users[0].password,
    };
    
    const res = await api
      .post('/api/auth/email')
      .send(userInfo);
      
    user.cookie = res.headers['set-cookie'][0];
  });

  it('should fetch all ads', async () => {
    const res = await api
      .get('/api/advertisements')
      .set('Cookie', user.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(3);
  });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .get('/api/advertisements');

    expect(res.statusCode).toBe(401);
  })
});
