const supertest = require('supertest');

const app = require('../../../src/app');
const dbUtil = require('../../utils/db.util');
const seeds = require('../seeds/advertisement.seed');
const data = require('../data/index.data');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/advertisements', () => {
  // Seed database
  let users = seeds.fetchAdvertisements();

  // Authenticate user
  beforeEach(async () => {
    const userInfo = {
      email: data.users[0].email,
      password: data.users[0].password,
    };
    
    const res = await api
    .post('/api/auth/email')
    .send(userInfo);
    
    users[0].cookie = res.headers['set-cookie'][0];
  });

  // Clear array after each test
  afterEach(() => users.length = 0);

  it('should fetch all ads', async () => {
    const res = await api
      .get('/api/advertisements')
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(3);
  });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .get('/api/advertisements');

    expect(res.statusCode).toBe(401);
  })
});
