const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { refreshToken, revokeToken } = require('../passport-loader');

// Login handler
async function login(req, res, next) {
  console.log('Login attempt:', { email: req.body.email });
  
  passport.authenticate('login', async (err, user, info) => {
    try {
      console.log('Passport authenticate callback:', { 
        error: err ? err.message : 'No error',
        userFound: !!user,
        info: info || 'No info'
      });
      
      if (err || !user) {
        const errorMessage = info?.error || info?.message || 'Failed to authenticate user';
        console.log('Login failed:', errorMessage);
        return res.status(401).json({
          success: false,
          message: errorMessage
        });
      }

      req.login(user, { session: false }, async (error) => {
        if (error) {
          console.error('req.login error:', error);
          return next(error);
        }

        // Clear any existing reset token
        if (user.reset_token) {
          await user.update({ reset_token: null });
        }

        // Generate tokens using the updated passport strategy
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            RoleId: user.RoleId
          },
          process.env.PROJECT_JWT_SECRET,
          { expiresIn: '15m' }
        );

        // Generate refresh token (this will be handled by the passport strategy)
        const refreshToken = req.authInfo?.refreshToken || null;

        if (!refreshToken) {
          console.error('No refresh token generated');
          return res.status(500).json({
            success: false,
            message: 'Authentication error'
          });
        }

        // For development, use more permissive cookie settings
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
          httpOnly: true,
          secure: false, // Set to false for local development without HTTPS
          sameSite: 'lax', // Use 'lax' for local development
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
          // Don't set domain for localhost
        };

        console.log('Setting refresh token cookie with options:', cookieOptions);
        
        // Set the cookie in the response
        res.cookie('refreshToken', refreshToken, cookieOptions);

        // Set CORS headers
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3001');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        
        console.log('Login successful:', { 
          userId: user.id, 
          email: user.email,
          hasToken: !!token,
          hasRefreshToken: !!refreshToken
        });
        
        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.Role?.name || null,
            RoleId: user.RoleId,
            image: user.image
          }
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      next(error);
    }
  })(req, res, next);
}

// Logout handler
async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Revoke the refresh token from cookie if exists
      if (req.cookies?.refreshToken) {
        await revokeToken(req.cookies.refreshToken);
        console.log('Revoked refresh token:', req.cookies.refreshToken);
        res.clearCookie('refreshToken');
        console.log('Cleared refresh token cookie');
      }
      
      // You might want to add the token to a blacklist here
      // if you want to revoke the access token as well
      
      return res.json({ success: true, message: 'Logged out successfully' });
    }
    
    return res.status(400).json({ success: false, message: 'No token provided' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Error during logout' });
  }
}

// In backend/controllers/auth.js
async function handleRefreshToken(req, res) {
  try {
    // Get refresh token from cookies
    const refreshTokenValue = req.cookies.refreshToken;
    console.log('Refresh token from cookie:', refreshTokenValue ? 'exists' : 'missing');
    
    if (!refreshTokenValue) {
      console.log('No refresh token found in cookies');
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }
    
    console.log('Attempting to refresh token...');
    
    // Create a mock request object that matches what refreshToken expects
    const mockReq = {
      body: { refreshToken: refreshTokenValue },
      cookies: req.cookies
    };
    
    // Call the refreshToken function
    return refreshToken(mockReq, res);
  } catch (error) {
    console.error('Refresh token error:', error);
    // Clear the refresh token cookie on error
    res.clearCookie('refreshToken');
    console.log('Cleared refresh token cookie due to error');
    return res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Verify token handler
async function verifyToken(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Get the User model
    const User = require('../models').User;
    
    // Verify the token
    jwt.verify(token, process.env.PROJECT_JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
          expired: err.name === 'TokenExpiredError'
        });
      }
      
      try {
        // Get the full user data including the image
        const user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password', 'reset_token'] }
        });
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        // Token is valid
        return res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            RoleId: user.RoleId,
            image: user.image // Include the image path
          }
        });
      } catch (dbError) {
        console.error('Database error during token verification:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error fetching user data'
        });
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying token'
    });
  }
}

// Signup handler
async function signup(req, res, next) {
  passport.authenticate('signup', { session: false }, async (err, user, info) => {
    try {
      if (err || !user) {
        return res.status(401).json({ 
          error: 'Failed to register user', 
          message: info?.message || 'Registration failed' 
        });
      }
      
      // Generate JWT token
      const jwt_content = { 
        id: user.id, 
        email: user.email, 
        RoleId: user.RoleId  
      };
      
      const token = jwt.sign(jwt_content, process.env.PROJECT_JWT_SECRET, { 
        expiresIn: 864000 // 10 days
      });
      
      // Return token and user info (without sensitive data)
      const { password, ...userWithoutPassword } = user.get({ plain: true });
      
      res.status(201).json({ 
        token,
        user: userWithoutPassword,
        message: 'Registration successful!'
      });
    } catch (error) {
      console.error('Signup error:', error);
      next(error);
    }
  })(req, res, next);
}

// Password reset token validation handler
async function passwordResetTokenValidation(req, res, next) {
  passport.authenticate('forgotpasswordjwt', { session: false }, (err, user, info) => {
    try {
      if (err || !user) {
        console.error('Token validation failed:', err || 'No user found');
        return res.status(404).json({ 
          success: false, 
          message: err?.message || 'Invalid or expired token' 
        });
      }
      
      if (!user.reset_token || user.reset_token !== req.body.token) {
        console.error('Token mismatch:', { 
          stored: user.reset_token ? 'exists' : 'missing', 
          provided: req.body.token ? 'exists' : 'missing' 
        });
        return res.status(422).json({ 
          success: false, 
          message: 'Token is invalid or has been used' 
        });
      }
      
      // Token is valid
      console.log(`✅ Token valid for user:`, { id: user.id, email: user.email });
      return res.json({ 
        success: true, 
        message: 'Token is valid',
        userId: user.id
      });
      
    } catch (error) {
      console.error('Error in token validation:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error during token validation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  })(req, res, next);
}

// Password reset handler
async function passwordReset(req, res, next) {
  passport.authenticate('forgotpasswordjwt', { session: false }, async (err, user, info) => {
    try {
      if (err || !user) {
        console.error('Password reset failed - user not found or error:', err || 'No user');
        return res.status(404).json({ 
          success: false,
          message: err?.message || 'Invalid or expired token' 
        });
      }

      // Get the token from either query or body
      const requestToken = req.body?.token || req.query?.token;
      
      if (!requestToken || user.reset_token !== requestToken) {
        console.error('Password reset failed - token mismatch:', {
          stored: user.reset_token ? 'exists' : 'missing',
          provided: requestToken ? 'exists' : 'missing'
        });
        return res.status(422).json({ 
          success: false,
          message: 'Invalid or used token' 
        });
      }

      if (!req.body.password) {
        return res.status(400).json({
          success: false,
          message: 'New password is required'
        });
      }

      // Update the user's password and clear the reset token
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      await user.update({
        password: hashedPassword,
        reset_token: null  // Clear the reset token after use
      });

      console.log(`✅ Password reset successful for user:`, { id: user.id, email: user.email });
      
      return res.json({ 
        success: true, 
        message: 'Password has been reset successfully' 
      });
      
    } catch (error) {
      console.error('Error in password reset:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to reset password',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  })(req, res, next);
}

module.exports = {
  login,
  logout,
  signup,
  passwordResetTokenValidation,
  passwordReset,
  verifyToken,
  handleRefreshToken
};
