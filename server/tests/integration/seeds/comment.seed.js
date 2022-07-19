const data = require('../data/index.data');
const User = require('../../../src/models/user.model');
const Post = require('../../../src/models/post.model');
const Comment = require('../../../src/models/comment.model');

exports.fetchComments = () => {
  let users = [];
  let posts = [];
  let comments = [];

  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 3; i++) {
      const _user = new User(data.users[i]);
      await _user.save();
      
      users.push({ data: _user });
    }
    
    // Seed posts
    for (let i = 0; i < 2; i++) {
      const _post = new Post({
        postedBy: users[0].data._id,
        content: data.posts[i].content,
      });
      
      await _post.save();
      posts.push(_post);
    };
    
    // Seed comments
    const userCount = users.length;
    
    for (let i = 0; i < 8; i++) {
      // Cycle through users to simulate a chat in comments
      const _user = users[i % userCount];
      
      const _comment = new Comment({
        postedBy: _user.data._id,
        postId: posts[0]._id,
        content: data.comments[i].content,
      });
      
      await _comment.save();
      comments.push(_comment);
    }
  });

  return { users, posts, comments };
};

exports.createComment = () => {
  let users = [];
  let posts = [];

  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 2; i++) {
      const _user = new User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }

    // Seed a post
    const _post = new Post({
      postedBy: users[0].data._id,
      content: data.posts[0].content,
    });

    await _post.save();
    posts.push(_post);
  });

  return { users, posts };
};

exports.likeComment = () => {
  let users = [];
  let posts = [];
  let comments = [];

  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 2; i++) {
      const _user = new User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }

    // Seed a post
    const _post = new Post({
      postedBy: users[0].data._id,
      content: data.posts[0].content,
    });

    await _post.save();
    posts.push(_post);

    // Seed a comment
    const _comment = new Comment({
      postedBy: users[1].data._id,
      postId: posts[0]._id,
      content: data.comments[0].content,
    });

    await _comment.save();
    comments.push(_comment);
  });

  return { users, posts, comments };
};
