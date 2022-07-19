const { faker } = require('@faker-js/faker');

const comments = [];

for (let i = 0; i < 8; i++) {
  comments.push({
    content: faker.lorem.sentence(),
  });
}

module.exports = comments;
