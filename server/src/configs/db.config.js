const mongoose = require('mongoose');

if (process.env.NODE_ENV === 'production') {
  mongoose.connect(process.env.MONGO_URI_PROD, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  mongoose.connection.once('open', () => console.log('Connected to production database'));

  mongoose.connection.on('error', (err) => console.log(err));
} else {
  // Make sure a mongod process is running with
  // 'sudo systemctl start mongod' before connecting
  mongoose.connect(process.env.MONGO_URI_DEV, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  mongoose.connection.once('open', () => console.log('Connected to development database'));

  mongoose.connection.on('error', (err) => console.log(err));
}
