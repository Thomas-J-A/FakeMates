const { faker } = require('@faker-js/faker');

const users = [];

for (let i = 0; i < 3; i++) {
  users.push({
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  });
}

module.exports = users;
