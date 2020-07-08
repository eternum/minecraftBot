const GitHubStrategy = require("passport-github").Strategy;

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

function initialize(passport, users) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
      },
      function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
          if (users.includes(profile.username)) {
            console.log("approved");
            return done(null, profile);
          }
          console.log("not approved");
          return done(null, false);
        });
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((obj, done) => done(null, obj));
}

module.exports = initialize;
