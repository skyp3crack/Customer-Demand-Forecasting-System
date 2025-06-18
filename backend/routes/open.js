const express = require('express');
const multer = require('multer');
const router = express.Router();
const c = require('../controllers');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const db = require('../models');
const { refreshToken } = require('../passport-loader');

// Ensure upload directories exist
const ensureUploadsDir = (dir) => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = ensureUploadsDir('uploads/profile-images');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

// Configure multer for CSV uploads
const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = ensureUploadsDir('uploads/csv');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, 'sales-' + Date.now() + path.extname(file.originalname).toLowerCase());
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF) are allowed!'), false);
  }
};

// File filter for CSV
const csvFileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

// Create multer instances
const uploadImage = multer({ 
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for images
});

const uploadCSV = multer({ 
  storage: csvStorage,
  fileFilter: csvFileFilter
});

// Route Open
router.get('/', c.general.index);
router.get('/staticdata', c.general.staticdata);

// Auth routes
router.post('/auth/login', c.auth.login);
router.post('/auth/signup', uploadImage.single('image'), c.auth.signup);
router.post('/auth/forgot-password', c.user.passwordForgot);
router.post('/auth/verify-reset-password-token', c.auth.passwordResetTokenValidation);
router.post('/auth/reset-password', c.auth.passwordReset);

// Token and session endpoints
router.post('/auth/refresh-token', (req, res) => c.auth.handleRefreshToken(req, res));
router.get('/auth/verify', c.auth.verifyToken);
router.post('/auth/logout', c.auth.logout);

// Remove the duplicate logout route
// router.post('/logout', c.auth.logout);  // This is now handled by /auth/logout

// Token verification endpoint
router.get('/verify-token', (req, res) => {
  // This will be handled by the auth controller
  c.auth.verifyToken(req, res);
});

// Sales Data Routes
router.post('/sales/import', uploadCSV.single('file'), c.salesdata.importData);
router.get('/sales', c.salesdata.getSalesData);

// Add new route for sales data
router.get('/sales/data', async (req, res) => {
    try {
        const { drug, startDate, endDate } = req.query;
        
        console.log('Fetching sales data with params:', { drug, startDate, endDate });

        const data = await db.salesData.findAll({
            where: {
                drug: drug,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['date', 'ASC']],
            raw: true // This will return plain objects
        });

        // Calculate max value for the heatmap
        const maxValue = data.length > 0 
            ? Math.max(...data.map(item => item.actual_sales))
            : 0;

        console.log(`Found ${data.length} records for drug ${drug}`);

        res.json({
            error: false,
            data: data,
            maxValue: maxValue
        });
    } catch (error) {
        console.error('Error in /sales/data route:', error);
        res.status(500).json({
            error: true,
            message: 'Error fetching sales data',
            details: error.message
        });
    }
});

module.exports = router;
