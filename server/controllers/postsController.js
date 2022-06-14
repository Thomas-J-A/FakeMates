exports.fetchPosts = (req, res) => {
  res.send('Fetched my posts');
};

exports.createPost = (req, res) => {
  res.send('Created post');
};

exports.likePost = (req, res) => {
  res.send('Liked post');
};

exports.removePost = (req, res) => {
  res.send('Removed post');
};
