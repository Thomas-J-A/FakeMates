const data = require('../data/index.data');
const User = require('../../../src/models/user.model');
const Post = require('../../../src/models/post.model');

exports.fetchPosts = () => {
  let users = [];
  let posts = [];
  
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 2; i++) {
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
    }
  });

  return { users, posts };
};

exports.createPost = () => {
  let users = [];

  beforeEach(async () => {
    // Seed a user
    const _user = new User(data.users[0]);
    await _user.save();

    users.push({ data: _user });
  });

  return users;
};

exports.likePost = () => {
  let users = [];
  let posts = [];

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

exports.removePost = () => {
  let users = [];
  let posts = [];

  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 2; i++) {
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
    }
  });

  return { users, posts };
};
