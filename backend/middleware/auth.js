const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from the Authorization header
 */
const authenticateJWT = (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE START ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  console.log('Request Headers:', {
    authorization: req.headers.authorization ? '***present***' : 'missing',
    cookie: req.headers.cookie ? '***present***' : 'missing',
    origin: req.headers.origin,
    host: req.headers.host
  });
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No token or invalid format');
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided',
      receivedAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 10) + '...' : 'none'
    });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔑 Token received, length:', token.length);
  
  try {
    console.log('🔍 Verifying token...');
    const decoded = jwt.verify(token, process.env.PROJECT_JWT_SECRET);
    console.log('✅ Token verified successfully:', {
      id: decoded.id,
      email: decoded.email,
      RoleId: decoded.RoleId,
      iat: new Date(decoded.iat * 1000).toISOString(),
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    // Handle both uid and id for backward compatibility
    if (decoded.uid && !decoded.id) {
      decoded.id = decoded.uid;
    }

    if (!decoded.id) {
      console.log('❌ No user ID found in token');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token: No user ID',
        tokenContents: Object.keys(decoded)
      });
    }

    req.user = decoded;
    console.log('👤 User authenticated:', { id: req.user.id, email: req.user.email });
    console.log('=== AUTH MIDDLEWARE END ===\n');
    return next();
  } catch (err) {
    console.log('❌ Token verification failed:', {
      name: err.name,
      message: err.message,
      expiredAt: err.expiredAt,
      date: err.date
    });
    
    let message = 'Failed to authenticate token';
    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }

    return res.status(401).json({ 
      success: false, 
      message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Role-based Authorization Middleware
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    console.log('🔒 Checking authorization for roles:', roles);
    console.log('User role:', req.user?.RoleId);

    if (!req.user) {
      console.log('❌ No user in request');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (roles.length && !roles.includes(req.user.RoleId)) {
      console.log('❌ Insufficient permissions');
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    console.log('✅ Authorization granted');
    next();
  };
};

module.exports = {
  authenticateJWT,
  authorize
};
