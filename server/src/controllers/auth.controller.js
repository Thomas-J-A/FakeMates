const jwtDecode = require('jwt-decode');
const bcrypt = require('bcryptjs');

const generateToken = require('../utils/generateToken.util');

exports.signInWithGoogle = (req, res,) => {
  res.send('Signed in with Google');
};

exports.signInWithGoogleCallback = (req, res) => {
  res.send('Signed in with Google, callback');
};

exports.signInWithEmail = async (req, res, next) => {
  try {
    const user = await req.models.User.findOne({ email: req.body.email });
    if (user === null) {
      return res.status(401).json({ message: 'Email does not exist' });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = generateToken(user);

    // Get a reference to token.exp value
    const decodedToken = jwtDecode(token);
    const expiresAt = decodedToken.exp;

    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    // Remove password field from user data before returning it
    const { password, ...rest } = user._doc;
    return res.status(200).json({
      currentUser: rest,
      expiresAt,
    });
  } catch (err) {
    // Pass any internal errors not explicitly handled
    // to express error-handling middleware (network, db errors)
    next(err);
  }
};

exports.signUpWithEmail = async (req, res, next) => {
  try {
    const existingUser = await req.models.User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const user = new req.models.User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      isOnline: true,
    });

    await user.save();

    const token = generateToken(user);

    // Get a reference to token.exp value
    const decodedToken = jwtDecode(token);
    const expiresAt = decodedToken.exp;

    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    // Remove password field from user data before returning it
    const { password, ...rest } = user._doc;
    return res.status(201).json({
      currentUser: rest,
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  // req.logOut(); clear req.session/req.user
  res.clearCookie('jwt', {
    httpOnly: true,
  });

  res.sendStatus(204);
};





// user registers with email/password and both are stored in db
// they can login with email/password or oauth

// user continues with oauth
// if email exists in db, create JWT token and continue
// if not, create new user (no password field)
// this user can only sign in with oauth
