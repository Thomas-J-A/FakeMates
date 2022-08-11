const mongoose = require('mongoose');

const fakeUserIds = Array.from({ length: 12 }, () => {
  // Validation checks are for strings not ObjectId types
  return new mongoose.Types.ObjectId().toString()
});

module.exports = fakeUserIds;
