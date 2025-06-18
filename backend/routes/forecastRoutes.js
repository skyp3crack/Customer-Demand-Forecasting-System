// backend/routes/forecastRoutes.js
const express = require('express');
const router = express.Router();
const { importForecast, getForecasts } = require('../controllers/forecast');
const { authenticateJWT, authorize } = require('../middleware/auth');
const forecastDataService = require('../services/forecastDataService');
const path = require('path');
const fs = require('fs');

// CORS middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Protected routes
router.post('/import-forecast', 
  authenticateJWT, 
  authorize([1]), // Use 1 instead of 'admin'
  importForecast
);

router.get('/forecasts', 
  authenticateJWT,
  getForecasts
);

/**
 * @swagger
 * /api/forecast/monthly:
 *   get:
 *     summary: Get monthly forecast data
 *     tags: [Forecast]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: drug
 *         schema:
 *           type: string
 *         description: Filter by drug code (e.g., 'M01AB')
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (inclusive) in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (inclusive) in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-01T00:00:00.000Z"
 *                   drug:
 *                     type: string
 *                     example: "M01AB"
 *                   predicted_sales:
 *                     type: number
 *                     format: float
 *                     example: 123.45
 *                   model_version:
 *                     type: string
 *                     example: "rf"
 */
router.get('/monthly', 
  authenticateJWT,
  async (req, res) => {
    try {
      const { drug, startDate, endDate } = req.query;
      const data = await forecastDataService.getMonthlyForecasts({
        drug,
        startDate,
        endDate
      });
      res.json(data);
    } catch (error) {
      console.error('Error getting monthly forecasts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get monthly forecast data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/forecast/yearly:
 *   get:
 *     summary: Get yearly aggregated forecast data
 *     tags: [Forecast]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: drug
 *         schema:
 *           type: string
 *         description: Filter by drug code (e.g., 'M01AB')
 *       - in: query
 *         name: startYear
 *         schema:
 *           type: integer
 *           example: 2024
 *         description: Filter by start year (inclusive)
 *       - in: query
 *         name: endYear
 *         schema:
 *           type: integer
 *           example: 2025
 *         description: Filter by end year (inclusive)
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   year:
 *                     type: integer
 *                     example: 2025
 *                   drug:
 *                     type: string
 *                     example: "M01AB"
 *                   total_sales:
 *                     type: number
 *                     format: float
 *                     example: 1880.60
 *                   avg_monthly_sales:
 *                     type: number
 *                     format: float
 *                     example: 156.72
 */
router.get('/yearly', 
  authenticateJWT,
  async (req, res) => {
    try {
      const { drug, startYear, endYear } = req.query;
      const data = await forecastDataService.getYearlyForecasts({
        drug,
        startYear: startYear ? parseInt(startYear) : undefined,
        endYear: endYear ? parseInt(endYear) : undefined
      });
      res.json(data);
    } catch (error) {
      console.error('Error getting yearly forecasts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get yearly forecast data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/forecast/daily:
 *   get:
 *     summary: Get daily forecast data
 *     tags: [Forecast]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: drug
 *         schema:
 *           type: string
 *         description: Filter by drug code (e.g., 'M01AB')
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (inclusive) in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (inclusive) in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-01T00:00:00.000Z"
 *                   drug:
 *                     type: string
 *                     example: "M01AB"
 *                   predicted_sales:
 *                     type: number
 *                     format: float
 *                     example: 123.45
 *                   forecast_type:
 *                     type: string
 *                     example: "daily"
 *                   model_version:
 *                     type: string
 *                     example: "rf"
 */
router.get('/daily', 
  authenticateJWT,
  async (req, res) => {
    try {
      const { drug, startDate, endDate } = req.query;
      const data = await forecastDataService.getDailyForecasts({
        drug,
        startDate,
        endDate
      });
      res.json(data);
    } catch (error) {
      console.error('Error getting daily forecasts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get daily forecast data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/forecast/import-daily-batch:
 *   post:
 *     summary: Import all daily forecasts for a specific year
 *     tags: [Forecast]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2025
 *         description: Year to import forecasts for
 *     responses:
 *       200:
 *         description: Successful operation
 */
router.post('/import-daily-batch', 
  authenticateJWT, 
  authorize([1]),
  async (req, res) => {
    try {
      console.log('Starting batch import...'); // Debug log
      const { year } = req.query;
      if (!year) {
        return res.status(400).json({ 
          success: false, 
          error: 'Year parameter is required' 
        });
      }

      const results = [];
      const months = [
        '01', '02', '03', '04', '05', '06',
        '07', '08', '09', '10', '11', '12'
      ];

      for (const month of months) {
        const fileName = `daily_forecast_rf_${year}${month}01.csv`;
        const filePath = path.join(__dirname, '../../forecasts', fileName);
        
        if (fs.existsSync(filePath)) {
          try {
            const result = await forecastDataService.importForecastData(filePath);
            results.push({
              month,
              ...result
            });
          } catch (error) {
            results.push({
              month,
              success: false,
              error: error.message
            });
          }
        }
      }

      res.json({
        success: true,
        year,
        results
      });
    } catch (error) {
      console.error('Error in batch import:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import daily forecasts',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/historical/all:
 *   get:
 *     summary: Get all historical forecast data
 *     tags: [Forecast]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-01T00:00:00.000Z"
 *                   drug:
 *                     type: string
 *                     example: "M01AB"
 *                   predicted_sales:
 *                     type: number
 *                     format: float
 *                     example: 123.45
 *                   forecast_type:
 *                     type: string
 *                     example: "daily"
 *                   model_version:
 *                     type: string
 *                     example: "rf"
 */
router.get('/historical/all',
  authenticateJWT,
  async (req, res) => {
    try {
      const data = await forecastDataService.getAllForecasts();
      res.json(data);
    } catch (error) {
      console.error('Error getting all historical forecasts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get all historical forecast data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } 
);

/**
 * @swagger
 * /api/forecast/heatmap:
 *   get:
 *     summary: Get daily sales data for heatmap visualization
 *     tags: [Forecast]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: drug
 *         schema:
 *           type: string
 *         description: Drug code to filter by
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the heatmap
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the heatmap
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       value:
 *                         type: number
 *                 maxValue:
 *                   type: number
 */
router.get('/heatmap',
  authenticateJWT,
  async (req, res) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 30000);

    try {
      console.log('Heatmap request received with query:', req.query);
      
      const { drug, startDate, endDate } = req.query;
      
      // Validate inputs
      if (!drug) {
        return res.status(400).json({ 
          error: 'Drug parameter is required',
          received: req.query 
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'Both startDate and endDate are required',
          received: req.query 
        });
      }

      // Validate date format
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          error: 'Invalid date format',
          received: { startDate, endDate }
        });
      }

      const data = await forecastDataService.getDailyHeatmapData({
        drug,
        startDate,
        endDate
      });

      clearTimeout(timeout);
      res.json(data);
    } catch (error) {
      clearTimeout(timeout);
      console.error('Detailed error in heatmap endpoint:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        query: req.query
      });
      
      res.status(500).json({ 
        error: 'Failed to fetch heatmap data',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

module.exports = router;