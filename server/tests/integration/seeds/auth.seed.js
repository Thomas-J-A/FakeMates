const data = require('../data/index.data');
const User = require('../../../src/models/user.model');

exports.signInWithEmail = () => {
  let users = [];

  beforeEach(async () => {
    // Seed a user
    const _user = new User(data.users[0]);
    await _user.save();

    users.push({ data: _user });
  });

  return users;
};
