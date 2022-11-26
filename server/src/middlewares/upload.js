const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `${ Date.now() }.${ ext }`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    const err = new Error('Image must be in PNG, JPG, or JPEG format');
    err.status = 400;
    cb(err, false);
  }
};

const multerInstance = multer({
  storage,
  limits: {
    files: 1,
    fileSize: 1024 * 1024 * 4, // 4MB
  },
  fileFilter,
});

const upload = (type, fieldName) => (req, res, next) => {
  let uploadMiddleware;
  
  switch (type) {
    case 'single':
      uploadMiddleware = multerInstance.single(fieldName);
      break;
    case 'any':
      uploadMiddleware = multerInstance.any();
      break;
  }
      
  // Explicitly call middleware for finer control over errors
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer error - bad request
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // Server error
      next(err);
    }

    next();
  });
};

module.exports = upload;




// Upload middleware without params (in case of bugs)

// // Explicitly call middleware for finer control over errors
// const upload = (req, res, next) => {
//   const uploadMiddleware = multerInstance.single('image');

//   uploadMiddleware(req, res, (err) => {
//     if (err instanceof multer.MulterError) {
//       // Multer error - bad request
//       return res.status(400).json({ message: err.message });
//     } else if (err) {
//       // Server error
//       next(err);
//     }

//     next();
//   });
// };
