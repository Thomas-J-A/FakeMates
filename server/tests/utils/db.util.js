const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Start in-memory database and connect with Mongoose
exports.setupDatabase = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('Connected to test database');
};

// Close Mongoose connection and stop in-memory database
exports.closeDatabase = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

// Clear database after each test
exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
      await collections[key].deleteMany({});
  }
};










// const collections = mongoose.connection.collections;
// for (const key in collections) {
//     const collection = collections[key];
//     await collection.deleteMany({}).exec();
// }


// for (const i in mongoose.connection.collections) {
//   mongoose.connection.collections[i].deleteMany({}).exec();
// }


// Object.keys(mongoose.connection.collections).forEach(async key => {
//   await mongoose.connection.collections[key].deleteMany({});












// Using Jest assertions


// From supertest README
// describe('GET /users', function() {
//   it('responds with json', async function() {
//     const response = await request(app)
//       .get('/users')
//       .set('Accept', 'application/json')
//     expect(response.headers["Content-Type"]).toMatch(/json/);
//     expect(response.status).toEqual(200);
//     expect(response.body.email).toEqual('foo@bar.com');
//   });
// });



// // group test using describe
// describe("POST /register", () => {
//   it("returns status code 201 if first name is passed", async () => {
//     const res = await request(app)
//       .post("/register")
//       .send({ firstName: "John" });
      
//     // toEqual recursively checks every field of an object or array.
//     expect(res.statusCode).toEqual(201);
//   });

//   it("returns bad request if firstname is missing", async () => {
//     const res = await request(app).post("/register").send();
//     expect(res.statusCode).toEqual(201);
//   });
// });



// describe("Test the root path", () => {
//   test("It should response the GET method", async () => {
//     const response = await request(app).get("/");
//     expect(response.statusCode).toBe(200);
//   });
// });







// Using supertest assertions


// describe("Test the root path", () => {
//   test("It should response the GET method", () => {
//     return request(app)
//       .get("/")
//       .expect(200);
//   });
// });





// describe('GET /user', function() {
//  it('responds with json', function(done) {
//    request(app)
//      .get('/user')
//      .auth('username', 'password')
//      .set('Accept', 'application/json')
//      .expect('Content-Type', /json/)
//      .expect(200, done);
//  });
// });


// describe('GET /users', function(){
//   it('respond with json', function(done){
//     request(app)
//       .get('/users')
//       .set('Accept', 'application/json')
//       .expect(200)
//       .end(function(err, res){
//         if (err) return done(err);
//         done()
//       });
//   })
// });


// describe('GET /user', function() {
//   it('responds with json', function(done) {
//     request(app)
//       .get('/user')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200, done);
//   });
// });


// describe("tags", () => {
//   describe("POST /tags", () => {
//     test("successful", async () => {
//       const res = await agent.post("/tags").send({ name: "test-tag"});
//       expect(res.statusCode).toEqual(201);
//       expect(res.body).toBeTruthy();
//     });
//   });
// });


























// import faker from 'faker'

// import request from 'supertest'
// import {Express} from 'express-serve-static-core'

// import db from '@exmpl/utils/db'
// import {createServer} from '@exmpl/utils/server'

// let server: Express
// beforeAll(async () => {
//   await db.open()
//   server = await createServer()
// })

// afterAll(async () => {
// 	await db.close()
// })

// describe('POST /api/v1/user', () => {
//   it('should return 201 & valid response for valid user', async done => {
//     request(server)
//       .post(`/api/v1/user`)
//       .send({
//         email: faker.internet.email(),
//         password: faker.internet.password(),
//         name: faker.name.firstName()
//       })
//       .expect(201)
//       .end(function(err, res) {
//         if (err) return done(err)
//         expect(res.body).toMatchObject({
//           userId: expect.stringMatching(/^[a-f0-9]{24}$/)
//         })
//         done()
//       })
//   })