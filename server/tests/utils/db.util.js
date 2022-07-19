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
