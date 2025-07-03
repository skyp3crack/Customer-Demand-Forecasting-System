// passport-loader.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcrypt');
const m = require('./models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const path = require('path');
const helper = require('./helper');
const GoogleOAuthStrategy = require('./strategies/google-oauth');
// JWT Strategy for protected routes
passport.use(
  'jwt',
  new JWTstrategy(
    {
      secretOrKey: process.env.PROJECT_JWT_SECRET,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true
    },
    async (req, token, done) => {
      console.log('🔐 [JWT Strategy] Verifying token...');
      console.log('🔑 Token payload:', JSON.stringify(token, null, 2));
      
      try {
        // Handle both uid and id for backward compatibility
        const userId = token.id || token.uid;
        
        if (!userId) {
          console.error('❌ No user ID found in token');
          return done(null, false, { message: 'No user ID in token' });
        }

        console.log(`🔍 Looking up user with ID: ${userId}`);
        const user = await m.User.findByPk(userId, {
          include: [{ model: m.Role, attributes: ['id', 'name'] }]
        });

        if (!user) {
          console.error(`❌ User not found with ID: ${userId}`);
          return done(null, false, { message: 'User not found' });
        }

        console.log(`✅ Found user:`, {
          id: user.id,
          email: user.email,
          RoleId: user.RoleId,
          status: user.status
        });

        // Only check status if it exists, otherwise consider the account active
        if (user.status && user.status !== 'active') {
          console.error(`❌ User account is not active: ${user.status}`);
          return done(null, false, { message: 'Account is not active' });
        }

        // Update last login time
        user.lastLoginAt = new Date();
        await user.save();

        // Ensure RoleId is set
        const userData = user.get({ plain: true });
        userData.RoleId = user.Role ? user.Role.id : null;
        
        console.log('🔑 Authentication successful, returning user:', {
          id: userData.id,
          email: userData.email,
          RoleId: userData.RoleId
        });
        
        return done(null, userData);
      } catch (error) {
        console.error('❌ Error in JWT strategy:', error);
        return done(error);
      }
    }
  )
);

// JWT Strategy for password reset
passport.use(
  'forgotpasswordjwt',
  new JWTstrategy(
    {
      secretOrKey: process.env.PROJECT_JWT_SECRET,
      jwtFromRequest: (req) => {
        // Try to get token from URL query parameter first (for email links)
        let token = ExtractJWT.fromUrlQueryParameter('token')(req);
        
        // If not found in URL, try to get from request body
        if (!token && req.body && req.body.token) {
          token = req.body.token;
        }
        
        return token;
      },
      passReqToCallback: true,
      ignoreExpiration: true // We'll handle token expiration manually
    },
    async (req, token, done) => {
      console.log('🔐 [Forgot Password JWT Strategy] Verifying token...');
      
      try {
        // Decode the base64-encoded user ID
        const userId = token.uid ? parseInt(helper.encoderBase64(token.uid, false), 10) : null;
        
        if (!userId) {
          console.error('❌ No valid user ID found in reset token');
          return done(null, false, { message: 'Invalid reset token' });
        }

        console.log(`🔍 Looking up user with ID: ${userId} for password reset`);
        const user = await m.User.findByPk(userId);

        if (!user) {
          console.error(`❌ User not found with ID: ${userId}`);
          return done(null, false, { message: 'User not found' });
        }

        // Check if token is expired (24 hours expiration)
        const now = Math.floor(Date.now() / 1000);
        if (token.exp && now > token.exp) {
          console.error('❌ Reset token has expired');
          return done(null, false, { message: 'Reset token has expired' });
        }

        // Get the token from either query or body
        const requestToken = req.body?.token || req.query?.token;
        
        // Verify the token matches the one stored in the user record
        if (user.reset_token !== requestToken) {
          console.error('❌ Reset token does not match');
          return done(null, false, { message: 'Invalid reset token' });
        }

        console.log(`✅ Reset token is valid for user:`, {
          id: user.id,
          email: user.email
        });
        
        return done(null, user);
      } catch (error) {
        console.error('❌ Error in forgot password JWT strategy:', error);
        return done(error);
      }
    }
  )
);

// Login strategy
passport.use(
  'login',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      session: false,
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      console.log('Login strategy - Start:', { email });
      
      try {
        // Find user by email
        console.log('Looking up user by email:', email);
        const user = await m.User.findOne({ 
          where: { email },
          include: [
            { 
              model: m.Role, 
              attributes: ['id', 'name'] 
            }
          ],
          // Explicitly include password field which is excluded by default
          attributes: { 
            include: ['password']
          },
          // Get raw data to bypass any instance methods that might interfere
          raw: true,
          // Make sure to include the Role association
          nest: true
        });

        if (!user) {
          console.log('User not found for email:', email);
          return done(null, false, { error: 'Invalid email or password' });
        }

        console.log('User found:', { 
          id: user.id, 
          email: user.email,
          hasPassword: !!user.password,
          passwordFieldType: typeof user.password,
          passwordLength: user.password ? user.password.length : 0,
          isGoogleUser: !!user.googleId
        });

        // For Google OAuth users without a password
        if (user.googleId && !user.password) {
          console.log('Google OAuth user attempting email/password login without a password');
          return done(null, false, { 
            error: 'password_required',
            message: 'Please set a password for your account before logging in with email/password.',
            email: user.email
          });
        }

        // For regular users without a password
        if (!user.password) {
          console.log('Regular user has no password - this should not happen');
          return done(null, false, { 
            error: 'account_error',
            message: 'Your account is not properly set up. Please contact support.'
          });
        }

        // Verify the password
        console.log('Comparing passwords...');
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password comparison result:', validPassword);
        
        if (!validPassword) {
          console.log('Password comparison failed for user:', user.id);
          return done(null, false, { 
            error: 'invalid_credentials',
            message: 'Invalid email or password' 
          });
        }

        console.log('Password valid, generating tokens...');
        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            RoleId: user.Role ? user.Role.id : null
          },
          process.env.PROJECT_JWT_SECRET,
          { expiresIn: '15m' }
        );

        // Generate refresh token
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

        console.log('Saving refresh token to database...');
        // Save refresh token to database
        try {
          await m.RefreshToken.create({
            token: refreshToken,
            userId: user.id,
            expiresAt
          });
          console.log('Refresh token saved successfully');
        } catch (dbError) {
          console.error('Error saving refresh token:', dbError);
          return done(dbError);
        }

        // Add RoleId to the user object for consistency
        user.RoleId = user.Role ? user.Role.id : null;

        // Store refresh token in the request object
        req.authInfo = { refreshToken };

        console.log('Login successful for user:', user.id);
        return done(null, user, { 
          token,
          refreshToken
        });
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }
  )
);

// Signup strategy
passport.use(
  'signup',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
      session: false
    },
    async (req, email, password, done) => {
      try {
        const { name, phone } = req.body;
        
        // Check if user already exists
        const existingUser = await m.User.findOne({ where: { email } });
        if (existingUser) {
          return done(null, false, { message: 'Email already in use' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Handle file path
        let imagePath = null;
        if (req.file) {
          // Use the path from multer's destination and filename
          imagePath = path.join('profile-images', path.basename(req.file.filename));
        }
        
        // Create new user
        const newUser = await m.User.create({
          name,
          email,
          phone: phone || null,  // Store phone if provided
          password: hashedPassword,
          RoleId: 2,  // Default role ID for regular users
          image: imagePath ? `/uploads/${imagePath.replace(/\\/g, '/')}` : null
        });

        // Get user with role data
        const user = await m.User.findByPk(newUser.id, {
          include: [{ model: m.Role, attributes: ['id', 'name'] }]
        });

        return done(null, user);
      } catch (error) {
        console.error('Signup error:', error);
        return done(error);
      }
    }
  )
);

// Refresh token function
async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ 
      success: false,
      message: 'Refresh token is required' 
    });
  }
  
  try {
    // Find the refresh token in the database
    const tokenDoc = await m.RefreshToken.findOne({
      where: {
        token: refreshToken,
        revoked: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [{
        model: m.User,
        as: 'user',  
        required: true,
        include: [{
          model: m.Role,
          as: 'Role',
          attributes: ['id', 'name']
        }]
      }]
    });
    
    if (!tokenDoc) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired refresh token' 
      });
    }
    
    const user = tokenDoc.user;
    
    // Revoke the used refresh token
    await tokenDoc.revoke();
    
    // Generate new access token
    const newToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        RoleId: user.Role ? user.Role.id : null
      },
      process.env.PROJECT_JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    // Save new refresh token
    await m.RefreshToken.create({
      token: newRefreshToken,
      userId: user.id,
      expiresAt
    });
    
    return res.json({ 
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error refreshing token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Logout function
async function revokeToken(token) {
  try {
    const tokenDoc = await m.RefreshToken.findOne({
      where: { token, revoked: false }
    });
    
    if (tokenDoc) {
      await tokenDoc.revoke();
    }
    
    return true;
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
}

// Clean up expired tokens (run this periodically)
async function cleanupExpiredTokens() {
  try {
    const result = await m.RefreshToken.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() }
      }
    });
    
    console.log(`Cleaned up ${result} expired refresh tokens`);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
}


passport.use('google', GoogleOAuthStrategy);


// Export functions
module.exports = { 
  passport,
  refreshToken,
  revokeToken,
  cleanupExpiredTokens
};