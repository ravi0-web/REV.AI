/**
 * Passport.js Configuration — Rev.AI
 *
 * Configures the Google OAuth 2.0 strategy using passport-google-oauth20.
 * On success, finds or creates a User document in MongoDB.
 */

const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('../models/User');

// ── Google OAuth Strategy (Optional) ──────────────────────
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_ID.includes('your_google')
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          const existingEmailUser = await User.findOne({
            email: profile.emails?.[0]?.value?.toLowerCase(),
          });

          if (existingEmailUser) {
            existingEmailUser.googleId       = profile.id;
            existingEmailUser.provider       = 'google';
            existingEmailUser.profilePicture = profile.photos?.[0]?.value || existingEmailUser.profilePicture;
            await existingEmailUser.save();
            return done(null, existingEmailUser);
          }

          user = await User.create({
            googleId:       profile.id,
            name:           profile.displayName || 'Google User',
            email:          profile.emails?.[0]?.value?.toLowerCase() || '',
            profilePicture: profile.photos?.[0]?.value || '',
            provider:       'google',
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log('✅  Google OAuth: enabled');
} else {
  console.log('⚠️  Google OAuth: disabled (no credentials configured)');
}

// ── Serialize / Deserialize (required by Passport even if not using sessions) ─
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
