const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getReportData, getDrugPerformanceReport } = require('../controllers/reports');
const reportShareController = require('../controllers/reportShare.controller');
const { validateRequest } = require('../middleware/validation');
const { authenticateJWT, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
    'text/plain',
    'text/x-csv',
    'application/octet-stream',
    'image/jpeg',
    'image/png'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, CSV, JPG, PNG, and TXT files are allowed.'), false);
  }
};

// Initialize multer with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Maximum of 5 files
  }
}).array('attachments', 5); // Field name should match frontend

// Custom middleware to handle multer errors
const handleFileUpload = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      logger.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        message: err.code === 'LIMIT_FILE_SIZE' 
          ? 'File too large. Maximum size is 10MB.' 
          : err.code === 'LIMIT_FILE_COUNT'
          ? 'Too many files. Maximum 5 files allowed.'
          : 'File upload error'
      });
    } else if (err) {
      // An unknown error occurred
      logger.error('File upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading files'
      });
    }
    // Everything went fine
    next();
  });
};

// Custom middleware to handle form data and validation
const validateFormData = (req, res, next) => {
  try {
    // For multipart/form-data, the body fields are already parsed by multer
    const { email, reportTitle, message = '' } = req.body;
    
    // Simple email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    // Required field validation
    if (!reportTitle || typeof reportTitle !== 'string' || reportTitle.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Report title is required'
      });
    }

    // If we got here, validation passed
    next();
  } catch (error) {
    logger.error('Error validating form data:', error);
    return res.status(400).json({
      success: false,
      message: 'Error processing form data'
    });
  }
};

// Apply authentication to all report routes
router.use(authenticateJWT);

// Existing report data endpoint - Admin only
router.get('/data', 
  authorize([1]), // Only admin (RoleId: 1) can access
  getReportData
);

// Share report via email - Admin only
router.post(
  '/share',
  authorize([1]), // Only admin can share reports
  handleFileUpload, // Handle file uploads first
  validateFormData, // Then validate the form data
  reportShareController.shareReport
);

// New drug performance report endpoint
router.post(
  '/drug-performance',
  authorize([1]), // Only admin (RoleId: 1) can access
  validateRequest({
    body: {
      drugIds: {
        isArray: true,
        notEmpty: true,
        errorMessage: 'At least one drug ID is required'
      },
      startDate: {
        isISO8601: true,
        errorMessage: 'Valid startDate is required (YYYY-MM-DD)'
      },
      endDate: {
        isISO8601: true,
        errorMessage: 'Valid endDate is required (YYYY-MM-DD)'
      },
      timePeriod: {
        optional: true,
        isIn: {
          options: [['daily', 'monthly']],
          errorMessage: 'timePeriod must be either "daily" or "monthly"'
        }
      }
    }
  }),
  getDrugPerformanceReport
);

module.exports = router;
