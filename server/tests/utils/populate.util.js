const supertest = require('supertest');

const app = require('../../src/app');

const api = supertest(app);

exports.createUser = async (userInfo) => {
  const res = await api
    .post('/api/auth/register')
    .send(userInfo);

  return {
    body: res.body,
    headers: res.headers,
  };
};

exports.createPost = async (userInfo, postInfo) => {
  const res = await api
    .post('/api/posts')
    .field('postedBy', userInfo.data._id)
    .field('content', postInfo.content)
    // .attach('image', postInfo.image)
    .set('Cookie', userInfo.cookie);

  return {
    body: res.body,
  };
};

exports.createComment = async (userInfo, postInfo, commentInfo) => {
  const res = await api
    .post('/api/comments')
    .query({ postid: postInfo._id })
    .set('Cookie', userInfo.cookie)
    .send(commentInfo);

  return {
    body: res.body,
  };
};
