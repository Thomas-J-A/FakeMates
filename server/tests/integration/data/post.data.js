const path = require('path');

const { faker } = require('@faker-js/faker');

const posts = [];

for (let i = 0; i < 2; i++) {
  const filename = (i === 0) ? 'test.jpg' : 'test.png';

  posts.push({
    postedBy: null,
    content: faker.lorem.sentence(),
    image: path.resolve(__dirname, `../../images/${ filename }`),
  });
}

module.exports = posts;
