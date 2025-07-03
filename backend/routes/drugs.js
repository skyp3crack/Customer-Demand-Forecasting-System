const express = require('express');
const router = express.Router();
const passport = require('passport');
const { getAvailableDrugs, getPerformanceReport, exportReport, getCombinedReport, searchDrugs } = require('../controllers/drugs');
const { authenticateJWT } = require('../middleware/auth');

// Remove authenticateJWT since it's handled globally
// Public route - no authentication needed
router.get('/available', getAvailableDrugs);

// Protected routes - require authentication
// Get performance report for selected drugs
router.get(
  '/performance-report',
  authenticateJWT,
  getPerformanceReport
);

// New combined report endpoint
router.get(
  '/combined-report',
  authenticateJWT,
  getCombinedReport
);

// Export report route
router.get(
    '/export-report',
    authenticateJWT,
    exportReport
  );

// Search drugs
router.get(
  '/search',
  authenticateJWT,
  searchDrugs
);

module.exports = router;
