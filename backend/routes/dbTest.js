const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { forecastData } = require('../models');

// Test database connection
router.get('/test-db-connection', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      message: 'Database connection successful',
      dialect: sequelize.getDialect(),
      database: sequelize.getDatabaseName()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// Test forecastData model
router.get('/test-forecast-model', async (req, res) => {
  try {
    // Check if table exists
    const tableExists = await sequelize.getQueryInterface().showAllTables()
      .then(tables => tables.includes('forecastData'));
    
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        error: 'Table not found',
        message: 'forecastData table does not exist in the database'
      });
    }

    // Try to count records
    const count = await forecastData.count();
    
    res.json({
      success: true,
      tableExists: true,
      recordCount: count,
      modelAttributes: Object.keys(forecastData.rawAttributes)
    });
  } catch (error) {
    console.error('Forecast model test error:', error);
    res.status(500).json({
      success: false,
      error: 'Forecast model test failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
