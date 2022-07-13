const path = require('path');

const { faker } = require('@faker-js/faker');

module.exports = [{
    postedBy: null,
    content: faker.lorem.sentence(),
    image: path.resolve(__dirname, '../images/test.jpg'),
  }, {
    postedBy: null,
    content: faker.lorem.sentence(),
    image: path.resolve(__dirname, '../images/test.png'),
}];
