const { faker } = require('@faker-js/faker');

const advertisements = [];

for (let i = 0; i < 6; i++) {
  advertisements.push({
    brandName: faker.company.companyName(),
    tagline: faker.company.bs(),
    backgroundUrl: faker.internet.url(),
  });
}

module.exports = advertisements;
