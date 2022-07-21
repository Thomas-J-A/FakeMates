const data = require('../data/index.data');
const User = require('../../../src/models/user.model');
const FriendRequest = require('../../../src/models/friend-request.model');

exports.fetchFriendRequests = () => {
  let users = [];
  let friendRequests = [];

  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 3; i++) {
      const _user = new User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }

    // Seed friend requests
    for (let i = 0; i < 2; i++) {
      const _friendRequest = new FriendRequest({
        from: users[i + 1].data._id,
        to: users[0].data._id,
      });

      await _friendRequest.save();
      friendRequests.push(_friendRequest);
    }
  });

  return { users, friendRequests };
};

exports.sendFriendRequest = () => {
  let users = [];

  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 2; i++) {
      const _user = new User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }
  });

  return users;
};

exports.handleFriendRequest = () => {
  let users = [];
  let friendRequests = [];

  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 3; i++) {
      const _user = new User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }

    // Seed a friend request
    const _friendRequest = new FriendRequest({
      from: users[1].data._id,
      to: users[0].data._id,
    });

    await _friendRequest.save();
    friendRequests.push(_friendRequest);
  });

  return { users, friendRequests };
};
