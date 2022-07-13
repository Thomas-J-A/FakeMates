const jwtDecode = require('jwt-decode');
const bcrypt = require('bcryptjs');

const generateToken = require('../utils/generateToken.util');

exports.continueWithGoogle = async (req, res, next) => {
  try {
    const token = generateToken(req.user);

    // Get a reference to token.exp value
    const decodedToken = jwtDecode(token);
    const expiresAt = decodedToken.exp;

    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    // Remove password field from user data before returning it
    const { password, ...rest } = req.user._doc;

    // Change status code depending on whether user registered or just signed in
    const status = req.isCreated ? 201 : 200;
    
    return res.status(status).json({
      currentUser: rest,
      expiresAt,
    });
  } catch (err) {
    // Pass any internal errors not explicitly handled
    // to express error-handling middleware (network, db errors)
    next(err);
  }
};

exports.signInWithEmail = async (req, res, next) => {
  try {
    const user = await req.models.User.findOne({ email: req.body.email });
    if (user === null) {
      return res.status(401).json({ message: 'Email doesn\'t exist' });
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
  // Clear req.session/req.user
  // req.logOut();

  // Remove cookie on client
  res.clearCookie('jwt', {
    httpOnly: true,
  });

  res.sendStatus(204);
};
