const supertest = require('supertest');

const app = require('../../src/app');
const { seedUser } = require('./seeds.util');

const api = supertest(app);

module.exports = createAuthedUser = () => {
  // The return value from this function is a reference since 
  // currentUser variable is an object and not a primitive
  let user = {};
  
  // Seed user
  beforeEach(async () => {
    user.data = await seedUser({
      firstName: 'Marcus',
      lastName: 'Aurelius',
      email: 'marco@gmail.com',
      password: 'password',
    });
  });
  
  // Authenticate user
  beforeEach(async () => {   
    const res = await api
      .post('/api/auth/email')
      .send({
        email: 'marco@gmail.com',
        password: 'password',
      });
  
    user.cookie = res.headers['set-cookie'][0];
  });

  return user;
}
