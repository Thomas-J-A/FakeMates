const data = require('../data/index.data');
const User = require('../../../src/models/user.model');
const Advertisement = require('../../../src/models/advertisement.model');

exports.fetchAdvertisements = () => {
  let users = [];
  
  beforeEach(async () => {
    // Seed a user
    const _user = new User(data.users[0]);
    await _user.save();
    
    users.push({ date: _user });
    
    // Seed ads
    for (let i = 0; i < 3; i++) {
      const _ad = new Advertisement(data.advertisements[i]);
      await _ad.save();
    }
  });

  return users;
};
