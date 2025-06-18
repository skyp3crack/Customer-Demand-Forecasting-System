const express = require('express');
const router = express.Router();
const { getReportData, getDrugPerformanceReport } = require('../controllers/reports');
const { validateRequest } = require('../middleware/validation');

// Existing report data endpoint
router.get('/data', getReportData);

// New drug performance report endpoint
router.post(
  '/drug-performance',
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
