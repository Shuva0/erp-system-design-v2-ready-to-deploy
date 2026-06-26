const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Google OAuth strategy.
 * On first login via Google, creates a new user with authProvider: 'google'.
 * On subsequent logins, finds the existing user by googleId.
 *
 * NOTE: a brand-new Google user has no `role` or `service` set yet — an
 * admin should assign these afterward (see /users/:id/role endpoint), or
 * you can default new Google sign-ups to role: 'employee' as below.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // e.g. /api/v1/auth/google/callback
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Also check if this email already has a local account, to avoid duplicates
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google to existing local account
            user.googleId = profile.id;
            user.authProvider = 'google';
            await user.save();
          } else {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              authProvider: 'google',
              role: 'employee', // default; admin can change later
              avatarUrl: profile.photos?.[0]?.value || '',
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
