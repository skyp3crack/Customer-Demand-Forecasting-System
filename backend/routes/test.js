const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');

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

// Test email route
router.get('/test-email', async (req, res) => {
  try {
    const testEmail = req.query.email || 'recipient@example.com';
    
    if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
      throw new Error('Email credentials not configured in environment variables');
    }

    console.log('Attempting to send email with settings:', {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: process.env.MAIL_USERNAME ? '***' : 'NOT SET',
      pass: process.env.MAIL_PASSWORD ? '***' : 'NOT SET',
      to: testEmail
    });

    const result = await emailService.sendReportEmail({
      to: testEmail,
      reportUrl: 'http://localhost:3001/dashboard/reports?test=true',
      reportTitle: 'Test Email',
      message: 'This is a test email from Pharma Forecast',
      fromUser: 'Test User'
    });

    console.log('Email sent successfully:', result);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Test email error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: {
        code: error.code,
        response: error.response,
        // Only include stack in development
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      }
    });
  }
});

module.exports = router;
