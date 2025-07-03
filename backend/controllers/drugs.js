const m = require('../models');
const { Op } = require('sequelize');
const { 
  getSalesData, 
  exportAsCSV, 
  exportAsJSON,
  exportCombinedAsCSV 
} = require('../helpers/exportUtils');

const getAvailableDrugs = async (req, res) => {
  console.log('=== getAvailableDrugs called ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  
  try {
    console.log('Fetching unique drugs from salesData...');
    console.log('Available models:', Object.keys(m));
    
    // Get unique drugs from salesData
    const drugs = await m.salesData.findAll({
      attributes: ['drug'],
      group: ['drug'],
      order: [['drug', 'ASC']],
      raw: true
    });

    // Extract just the drug codes
    const drugList = drugs.map(item => item.drug);
    console.log(`Found ${drugList.length} unique drugs`);

    res.json({
      success: true,
      data: drugList
    });
  } catch (error) {
    console.error('Error in getAvailableDrugs:', error);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching available drugs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getPerformanceReport = async (req, res) => {
  console.log('=== getPerformanceReport called ===');
  console.log('Query params:', req.query);
  
  try {
    const { drugIds, startDate, endDate } = req.query;
    
    // Validate required parameters
    if (!drugIds) {
      return res.status(400).json({
        success: false,
        message: 'drugIds parameter is required'
      });
    }

    const drugList = Array.isArray(drugIds) ? drugIds : drugIds.split(',');
    
    // Build where clause
    const where = {
      drug: drugList,
      date: {}
    };

    if (startDate) where.date[Op.gte] = new Date(startDate);
    if (endDate) where.date[Op.lte] = new Date(endDate);

    // Get sales data for selected drugs
    const salesData = await m.salesData.findAll({
      where,
      order: [['date', 'ASC']],
      raw: true
    });

    // Transform data to match frontend expectations
    const formattedData = salesData.map(item => ({
      date: item.date,
      data: {
        [item.drug]: item.actual_sales || 0
      }
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error in getPerformanceReport:', error);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Error generating performance report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const exportReport = async (req, res) => {
  console.log('=== exportReport called ===');
  console.log('Query params:', req.query);
  
  try {
    const { 
      drugIds, 
      actualStart, 
      actualEnd, 
      forecastStart, 
      forecastEnd,
      format = 'csv' 
    } = req.query;
    
    // Get user email from the authenticated user
    const userEmail = req.user ? req.user.email : 'unknown';

    // Parse drug IDs
    const drugIdList = drugIds ? drugIds.split(',') : [];
    if (drugIdList.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one drug ID is required' });
    }

    // Fetch actual data if date range is provided
    const actualData = actualStart && actualEnd
      ? await getSalesData(drugIdList, actualStart, actualEnd, 'actual')
      : [];

    // Fetch forecast data if date range is provided
    const forecastData = forecastStart && forecastEnd
      ? await getSalesData(drugIdList, forecastStart, forecastEnd, 'forecast')
      : [];

    // Prepare metadata
    const metadata = {
      actualDateRange: { start: actualStart, end: actualEnd },
      forecastDateRange: forecastStart && forecastEnd ? { start: forecastStart, end: forecastEnd } : null,
      exportedBy: userEmail,
      exportDate: new Date().toISOString()
    };

    // Export based on format
    if (format.toLowerCase() === 'json') {
      return exportAsJSON(res, {
        actual: actualData,
        forecast: forecastData,
        metadata
      });
    }

    // Default to CSV
    return exportCombinedAsCSV(res, {
      actual: actualData,
      forecast: forecastData,
      metadata
    });
  } catch (error) {
    console.error('Error in exportReport:', error);
    res.status(500).json({ success: false, message: 'Failed to export report', error: error.message });
  }
};

const getCombinedReport = async (req, res) => {
  console.log('=== getCombinedReport called ===');
  console.log('Query params:', req.query);
  
  try {
    const { 
      drugIds, 
      actualStart, 
      actualEnd, 
      forecastStart, 
      forecastEnd 
    } = req.query;

    // Validate required parameters
    if (!drugIds) {
      return res.status(400).json({
        success: false,
        message: 'drugIds parameter is required'
      });
    }

    const drugList = Array.isArray(drugIds) ? drugIds : drugIds.split(',');

    // 1. Fetch actual sales data
    const actualWhere = {
      drug: drugList,
      date: {}
    };

    if (actualStart) actualWhere.date[Op.gte] = new Date(actualStart);
    if (actualEnd) actualWhere.date[Op.lte] = new Date(actualEnd);

    const actualSales = await m.salesData.findAll({
      where: actualWhere,
      order: [['date', 'ASC']],
      raw: true
    });

    // 2. Fetch forecast data
    const forecastWhere = {
      drug: drugList,
      date: {}
    };

    if (forecastStart) forecastWhere.date[Op.gte] = new Date(forecastStart);
    if (forecastEnd) forecastWhere.date[Op.lte] = new Date(forecastEnd);

    const forecastData = await m.forecastData.findAll({
      where: forecastWhere,
      order: [['date', 'ASC']],
      raw: true
    });

    // 3. Format response
    const response = {
      actual: actualSales.map(item => ({
        date: item.date,
        drug: item.drug,
        value: item.actual_sales,
        type: 'actual'
      })),
      forecast: forecastData.map(item => ({
        date: item.date,
        drug: item.drug,
        value: item.predicted_sales,
        type: 'forecast',
        forecastType: item.forecast_type,
        modelVersion: item.model_version
      }))
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in getCombinedReport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate combined report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Search for drugs by name or code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchDrugs = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search in salesData for drugs that match the query
    const drugs = await m.salesData.findAll({
      attributes: ['drug'],
      where: {
        drug: {
          [m.Sequelize.Op.iLike]: `%${query}%`
        }
      },
      group: ['drug'],
      limit: 10, // Limit to 10 results for performance
      raw: true
    });

    // Extract just the drug codes
    const results = drugs.map(item => ({
      id: item.drug, // Using drug code as ID
      name: item.drug, // Using drug code as name (you might want to map to actual names if available)
      code: item.drug
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching drugs:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching drugs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAvailableDrugs,
  getPerformanceReport,
  exportReport,
  getCombinedReport,
  searchDrugs
};
