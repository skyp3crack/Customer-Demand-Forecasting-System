const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const m = require('../models');
const jwt = require('jsonwebtoken');

const strategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    console.log('Google Profile:', JSON.stringify(profile, null, 2));
    
    try {
      // Find or create user without including Role initially
      let user = await m.User.findOne({
        where: { 
          [m.Sequelize.Op.or]: [
            { googleId: profile.id },
            { email: profile.emails[0].value }
          ]
        }
      });

      if (!user) {
        // Create new user if not exists
        user = await m.User.create({
          email: profile.emails[0].value,
          googleId: profile.id,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          status: 'active',
          emailVerified: true,
          RoleId: 2 // Default role ID for new users
        });
      } else if (!user.googleId) {
        // Update existing user with Google ID
        user.googleId = profile.id;
        await user.save();
      }

      // Get role separately to avoid timestamp issues
      const role = await m.Role.findByPk(user.RoleId);
      const roleName = role ? role.name : 'user';

      // Generate tokens
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          RoleId: user.RoleId,
          role: roleName
        },
        process.env.PROJECT_JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshTokenObj = jwt.sign(
        { id: user.id },
        process.env.PROJECT_JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Save refresh token to database
      await m.RefreshToken.create({
        token: refreshTokenObj,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Return user with tokens
      return done(null, { 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: roleName,
          RoleId: user.RoleId
        },
        token,
        refreshToken: refreshTokenObj
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, false);
    }
  }
);

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser(async (id, done) => {
  try {
    const user = await m.User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = strategy;