const JwtStrategy = require('passport-jwt').Strategy;
const GoogleTokenStrategy = require('passport-google-token').Strategy;

const extractJwtFromCookie = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.jwt;
  }

  return token;
};

const jwtOpts = {
  jwtFromRequest: extractJwtFromCookie,
  secretOrKey: process.env.ACCESS_TOKEN_SECRET,
  passReqToCallback: true,
};

module.exports = (passport) => {
  // With { session: false } in auth call, calling done() will populate
  // req.user and call next(), but it won't call serializeUser()
  passport.use(new JwtStrategy(jwtOpts, async (req, jwt_payload, done) => {
    try {
      const user = await req.models.User.findById(jwt_payload.sub).exec();
      
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err, false);
    }
  }));

  // 'accessToken' and 'refreshToken' are used to further query Google's API
  // and not needed for authentication
  passport.use(new GoogleTokenStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    passReqToCallback: true,
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const result = await req.models.User.findOrCreate(
        { email: profile.emails[0].value },
        {
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
        }
      );

      // Status code in res will change depending on whether
      // a user was found or created (signed in || signed up)
      req.isCreated = result.created;

      done(null, result.doc);
    } catch (err) {
      console.log(err);
      done(err, false);
    }
  }));

  // // Serialize user into session/persist user info in session
  // // Not required if using JWT-based auth, though some OAuth providers
  // // require it for the initial handshake
  // passport.serializeUser((user, done) => {
  //   done(null, user._id);
  // });

  // // Deserialize user from session
  // // Not required if using JWT-based auth, though some OAuth providers
  // // require it for the initial handshake
  // passport.deserializeUser((id, done) => {
  //   User.findById(id, (err, user) => {
  //     done(err, user);
  //   });
  // });
};

// Sessions are sometimes required in OAuth strategies for the
// initial handshake (not for creating a persistent login session)

// 'After successful authentication, Passport will establish a persistent login session' (by default)
// ===
// After calling done() in the verify cb, the user object will be serialized into req.session provided by express-session

// Passport OAuth strategy + sessions
// sign in with google => serialize user to session => protect routes by checking for req.session.passport.user property, or req.isAuthenticated()
// OR
// Passport OAuth strategy + JWT tokens
// sign in with google => create and send JWT token => protect routes by verifying this token (disable sessions - don't serialize user to req.session)
