// backend/controllers/forecastController.js

const forecastDataService = require('../services/forecastDataService');

const importForecast = async (req, res) => {
  try {
    console.log('Starting forecast import...');
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    const result = await forecastDataService.importForecastData(req.file.path);
    console.log('Import successful:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Import Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...error
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to import forecast data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getForecasts = async (req, res) => {
  try {
    const { drug, startDate, endDate, type = 'monthly' } = req.query;
    
    let forecasts;
    if (type === 'daily') {
      forecasts = await forecastDataService.getDailyForecasts({
        drug,
        startDate,
        endDate
      });
    } else {
      forecasts = await forecastDataService.getForecasts({
      drug,
      startDate,
      endDate
    });
    }
    
    res.status(200).json(forecasts);
  } catch (error) {
    console.error('Get Forecasts Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get forecast data' 
    });
  }
};

module.exports = {
  importForecast,
  getForecasts
};
