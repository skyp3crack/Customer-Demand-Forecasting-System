const express = require('express');
const router = express.Router();

// Test endpoint to verify JWT configuration
router.get('/test-jwt', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    message: 'Add ?check=your_jwt_token_here to verify a token'
  });
});

// Add this to verify a specific token
router.get('/test-jwt/verify', (req, res) => {
  const token = req.query.check;
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  const jwt = require('jsonwebtoken');
  
  try {
    const decoded = jwt.verify(token, process.env.PROJECT_JWT_SECRET);
    res.json({
      valid: true,
      decoded,
      expires: new Date(decoded.exp * 1000).toISOString(),
      now: new Date().toISOString()
    });
  } catch (err) {
    res.status(401).json({
      valid: false,
      error: err.message,
      message: 'Token verification failed'
    });
  }
});

module.exports = router;
