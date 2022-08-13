// Regular fs methods don't return Promises yet, 
// so use fs.promises - aliased as fs - with async/await
const { promises: fs } = require('fs');

const removeFile = async (path, next) => {
  try {
    await fs.unlink(path);
  } catch (err) {
    next(err);
  }
};

// property parameter is one of 'body', 'query', 'params', or 'headers'
module.exports = (schema, property) => (req, res, next) => {
  const context = req.context ? req.context : {};
  
  const { error, value } = schema.validate(req[property], { stripUnknown: true, context });
  
  if (error) {
    // Remove file/s from uploads directory if there is any validation error
    // to prevent duplicate data on subsequent requests
    if (req.file) {
      // Remove post image (upload.single stores file in req.file)
      removeFile(req.file.path, next);
    } 

    if (req.files) {
      // Remove profile/background image (upload.any stores file/s in req.files)
      removeFile(req.files[0].path, next);
    }

    return res.status(400).json({ message: error.details[0].message });
  }

  // Replace req[property] with sanitized/validated data
  req[property] = value;

  next();
};
