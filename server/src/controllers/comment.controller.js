exports.fetchComments = (req, res) => {
  res.send('Fetched comments');
};

exports.createComment = (req, res) => {
  res.send('Created comment');
};

exports.likeComment = (req, res) => {
  res.send('Liked comment');
};
