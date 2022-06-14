exports.signInWithGoogle = (req, res) => {
  res.send('Signed in with Google');
};

exports.signInWithGoogleCallback = (req, res) => {
  res.send('Signed in with Google, callback');
};

exports.signInWithEmail = (req, res) => {
  res.send('Signed in with email');
};

exports.signUpWithEmail = (req, res) => {
  res.send('Signed up with email');
};

exports.logout = (req, res) => {
  res.send('Loged out');
};
