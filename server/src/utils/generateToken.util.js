const jwt = require('jsonwebtoken');

module.exports = (user) => {
  return jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: 60 * 15, // 15 minutes
    // algorithm: 'HS256,
  });
};
