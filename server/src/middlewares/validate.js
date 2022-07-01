const Joi = require('joi');

module.exports = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  req.body = value;
  next();
};
