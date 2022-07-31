// Regular fs methods don't return Promises yet, 
// so use fs.promises - aliased as fs - with async/await
const { promises: fs } = require('fs');
const Joi = require('joi');

const removeFile = async (path, next) => {
  try {
    await fs.unlink(path);
  } catch (err) {
    next(err);
  }
};

// property parameter is one of 'body', 'query', 'params', or 'headers'
module.exports = (schema, property) => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { stripUnknown: true });
  
  if (error) {
    if (req.file) {
      // Remove file from uploads directory if there is any validation error
      // to prevent duplicate data on subsequent requests
      removeFile(req.file.path, next);
    }

    return res.status(400).json({ message: error.details[0].message });
  }

  // Replace req[property] with sanitized/validated data
  req[property] = value;

  next();
};
