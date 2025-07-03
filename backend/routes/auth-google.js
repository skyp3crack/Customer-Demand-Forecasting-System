const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const m = require('../models');
const c = require('../controllers/auth');
const { refreshToken } = require('../passport-loader');

// Google OAuth login
router.get(
  '/google',
  (req, res, next) => {
    const options = {
      scope: ['profile', 'email'],
      session: false,
      accessType: 'offline',
      prompt: 'select_account consent',
      includeGrantedScopes: true
    };
    
    if (req.query.login_hint) {
      options.loginHint = req.query.login_hint;
    }
    
    passport.authenticate('google', options)(req, res, next);
  }
);

// Google OAuth callback
router.get('/google/callback',
  (req, res, next) => {
    console.log('Google OAuth callback received. Query params:', req.query);
    
    // Add error handling for the authentication
    passport.authenticate('google', {
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
      session: false,
      failureMessage: true
    })(req, res, next);
  },
  async (req, res, next) => {
    try {
      if (!req.user) {
        console.error('No user in request after Google OAuth');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      const { token, refreshToken } = req.user;
      
      if (!token || !refreshToken) {
        console.error('Missing tokens in Google OAuth response');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      console.log('Google OAuth successful, redirecting to frontend with tokens');
      
      // Redirect to frontend with tokens in URL
      res.redirect(
        `${process.env.FRONTEND_URL}/oauth-callback?` +
        `token=${encodeURIComponent(token)}&` +
        `refreshToken=${encodeURIComponent(refreshToken)}`
      );
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error.message || 'auth_failed')}`
      );
    }
  }
);

// Set password for Google OAuth users
router.post('/set-password', 
  async (req, res, next) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email and new password are required'
        });
      }

      // Find user by email
      const user = await m.User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Hash and set the new password
      const salt = await require('bcrypt').genSalt(10);
      const hashedPassword = await require('bcrypt').hash(newPassword, salt);
      
      await user.update({
        password: hashedPassword
      });

      return res.status(200).json({
        success: true,
        message: 'Password set successfully. You can now log in with email and password.'
      });
    } catch (error) {
      console.error('Error setting password:', error);
      return res.status(500).json({
        success: false,
        message: 'Error setting password',
        error: error.message
      });
    }
  }
);

// Use existing logout controller
router.get('/auth/logout', c.logout);

module.exports = router;