exports.fetchFriendRequests = (req, res) => {
  res.send('Fetch friend requests');
};

exports.sendFriendRequest = (req, res) => {
  res.send('Sent friend request');
};

exports.handleFriendRequest = (req, res) => {
  res.send('Accepted/rejected friend request');
};
