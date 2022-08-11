const supertest = require('supertest');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const { seedAdvertisement } = require('../utils/seeds.util');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

describe('GET /api/advertisements', () => {
  const currentUser = createAuthedUser();

  it('should fetch all ads', async () => {
    // Seed ads
    for (let i = 0; i < 3; i++) {
      await seedAdvertisement();
    }

    // Fetch ads
    const res = await api
      .get('/api/advertisements')
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(3);
  });


  it('should return 401 if not authenticated', async () => {
    const res = await api
      .get('/api/advertisements');

    expect(res.statusCode).toBe(401);
  })
});
