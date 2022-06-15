const mongoose = require('mongoose');

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.log(`Failed to connect to MongoDB: ${ err }`);
  }
};

module.exports = connectToDatabase;
