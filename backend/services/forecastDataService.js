const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { forecastData } = require('../models');
const { Op } = require('sequelize');

// Helper function to check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    console.error('Error checking file existence:', err);
    return false;
  }
};

const forecastDataService = {
  async importForecastData(filePath = null) {
    const results = [];
    const defaultPath = path.join(__dirname, '../../forecasts/monthly_forecast_rf_202501.csv');
    const actualPath = path.normalize(filePath || defaultPath);
    
    console.log(`Attempting to read forecast data from: ${actualPath}`);
    
    // Check if file exists
    if (!fileExists(actualPath)) {
      const error = new Error(`File not found at path: ${actualPath}`);
      error.code = 'ENOENT';
      throw error;
    }
    
    console.log('File exists, starting to read...');
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(actualPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          if (results.length === 0) {
            return reject(new Error('No data found in the CSV file'));
          }
          
          try {
            // Determine forecast type from filename
            const fileName = path.basename(actualPath);
            let importResult;
            
            if (fileName.includes('daily_forecast')) {
              console.log(`Found ${results.length} daily forecast records`);
              importResult = await this.processDailyForecasts(results);
              console.log('Successfully imported daily forecast data');
            } else if (fileName.includes('monthly_forecast')) {
              console.log(`Found ${results.length} monthly forecast records`);
              importResult = await this.processMonthlyForecasts(results);
            console.log('Successfully imported monthly forecast data');
            } else {
              throw new Error('Unsupported forecast type');
            }
            
            resolve({
              success: true,
              message: 'Successfully imported forecast data',
              ...importResult
            });
          } catch (error) {
            console.error('Error processing forecasts:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        });
    });
  },

  async processMonthlyForecasts(records) {
    try {
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('No records provided for processing');
      }

      const forecastDataArray = [];
      const drugCodes = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06'];
      let invalidRecords = 0;
      
      console.log(`Processing ${records.length} records...`);
      
      records.forEach((row, index) => {
        try {
          if (!row.Year || !row.Month) {
            console.warn(`Record at index ${index} is missing Year or Month`);
            invalidRecords++;
            return;
          }
          
          drugCodes.forEach(code => {
            if (row[code]) {
              const salesValue = parseFloat(row[code]);
              if (isNaN(salesValue)) {
                console.warn(`Invalid sales value for drug ${code} in record ${index}: ${row[code]}`);
                return;
              }
              
              forecastDataArray.push({
                drug: code,
                date: new Date(parseInt(row.Year), parseInt(row.Month) - 1, 1),
                predicted_sales: salesValue,
                forecast_type: 'monthly',
                model_version: 'rf'
              });
            }
          });
        } catch (error) {
          console.error(`Error processing record at index ${index}:`, error);
          invalidRecords++;
        }
      });

      if (forecastDataArray.length === 0) {
        throw new Error('No valid forecast data to import');
      }

      // First, delete existing monthly forecasts for the same dates
      const dates = [...new Set(forecastDataArray.map(record => record.date))];
      await forecastData.destroy({
        where: {
          forecast_type: 'monthly',
          date: {
            [Op.in]: dates
          }
        }
      });
      
      // Then insert new data
      const result = await forecastData.bulkCreate(forecastDataArray, {
        fields: ['drug', 'date', 'forecast_type', 'predicted_sales', 'model_version']
      });
      
      return {
        totalRecords: records.length,
        validRecords: forecastDataArray.length,
        invalidRecords,
        importedCount: result.length,
        message: 'Data imported successfully with duplicate prevention'
      };
    } catch (error) {
      console.error('Error in processMonthlyForecasts:', error);
      throw error;
    }
  },

  async getForecasts({ drug, startDate, endDate }) {
    const whereClause = { forecast_type: 'monthly' };
    
    if (drug) whereClause.drug = drug;
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }
    
    return forecastData.findAll({
      where: whereClause,
      order: [['date', 'ASC']]
    });
  },

  async getYearlyForecasts({ drug, startYear, endYear } = {}) {
    try {
      const whereClause = {
        forecast_type: 'monthly'
      };

      if (drug) {
        whereClause.drug = drug;
      }

      if (startYear || endYear) {
        whereClause.date = {};
        if (startYear) {
          whereClause.date[Op.gte] = new Date(startYear, 0, 1);
        }
        if (endYear) {
          whereClause.date[Op.lte] = new Date(endYear, 11, 31);
        }
      }

      console.log('getYearlyForecasts: Fetching monthly data for aggregation with whereClause:', whereClause);

      const forecasts = await forecastData.findAll({
        where: whereClause,
        attributes: ['date', 'drug', 'predicted_sales'],
        order: [
          ['date', 'ASC'],
          ['drug', 'ASC']
        ]
      });

      console.log(`getYearlyForecasts: Fetched ${forecasts.length} monthly records.`);

      // Group by year and drug
      const yearlyData = {};
      forecasts.forEach(forecast => {
        const year = new Date(forecast.date).getFullYear();
        const key = `${year}-${forecast.drug}`;
        
        if (!yearlyData[key]) {
          yearlyData[key] = {
            year,
            drug: forecast.drug,
            predicted_sales: 0
          };
        }
        
        const sales = parseFloat(forecast.predicted_sales);
        if (!isNaN(sales)) {
          yearlyData[key].predicted_sales += sales;
        } else {
          console.warn(`Skipping invalid predicted_sales for ${forecast.drug} on ${forecast.date}: ${forecast.predicted_sales}`);
        }
      });

      console.log('getYearlyForecasts: Aggregated yearly data:', yearlyData);

      // Convert to array and format for frontend
      return Object.values(yearlyData)
        .map(yearData => ({
          date: `${yearData.year}`,
          drug: yearData.drug,
          predicted_sales: parseFloat(yearData.predicted_sales.toFixed(2)),
          forecast_type: 'yearly',
          model_version: 'rf'
        }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date) || a.drug.localeCompare(b.drug));
    } catch (error) {
      console.error('Error in getYearlyForecasts:', error);
      throw error;
    }
  },

  async getMonthlyForecasts({ drug, startDate, endDate } = {}) {
    try {
      const whereClause = {
        forecast_type: 'monthly'
      };

      if (drug) {
        whereClause.drug = drug;
      }

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          whereClause.date[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.date[Op.lte] = new Date(endDate);
        }
      }

      const forecasts = await forecastData.findAll({
        where: whereClause,
        order: [
          ['date', 'ASC'],
          ['drug', 'ASC']
        ]
      });

      return forecasts.map(forecast => ({
        date: forecast.date,
        drug: forecast.drug,
        predicted_sales: forecast.predicted_sales,
        model_version: forecast.model_version
      }));
    } catch (error) {
      console.error('Error in getMonthlyForecasts:', error);
      throw error;
    }
  },

  async processDailyForecasts(records) {
    try {
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('No records provided for processing');
      }

      const forecastDataArray = [];
      const drugCodes = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06'];
      let invalidRecords = 0;
      
      console.log(`Processing ${records.length} daily forecast records...`);
      
      records.forEach((row, index) => {
        try {
          if (!row.Drug || !row.Date || !row.Predicted_Sales) {
            console.warn(`Record at index ${index} is missing required fields`);
            invalidRecords++;
            return;
          }
          
          if (!drugCodes.includes(row.Drug)) {
            console.warn(`Invalid drug code: ${row.Drug}`);
            invalidRecords++;
            return;
          }
          
          const salesValue = parseFloat(row.Predicted_Sales);
          if (isNaN(salesValue)) {
            console.warn(`Invalid sales value for drug ${row.Drug} in record ${index}: ${row.Predicted_Sales}`);
            invalidRecords++;
            return;
          }
          
          forecastDataArray.push({
            drug: row.Drug,
            date: new Date(row.Date),
            predicted_sales: salesValue,
            forecast_type: 'daily',
            model_version: 'rf'
          });
        } catch (error) {
          console.error(`Error processing record at index ${index}:`, error);
          invalidRecords++;
        }
      });

      if (forecastDataArray.length === 0) {
        throw new Error('No valid forecast data to import');
      }

      // Get unique dates from the records
      const dates = [...new Set(forecastDataArray.map(record => record.date))];
      
      // Delete existing daily forecasts for these dates
      await forecastData.destroy({
        where: {
          forecast_type: 'daily',
          date: {
            [Op.in]: dates
          }
        }
      });

      // Insert new records
      const result = await forecastData.bulkCreate(forecastDataArray, {
        fields: ['drug', 'date', 'forecast_type', 'predicted_sales', 'model_version']
      });
      
      return {
        totalRecords: records.length,
        validRecords: forecastDataArray.length,
        invalidRecords,
        importedCount: result.length,
        message: 'Daily forecast data imported successfully'
      };
    } catch (error) {
      console.error('Error in processDailyForecasts:', error);
      throw error;
    }
  },

  async getDailyForecasts({ drug, startDate, endDate } = {}) {
    try {
      const whereClause = {
        forecast_type: 'daily'
      };

      if (drug) {
        whereClause.drug = drug;
      }

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          whereClause.date[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.date[Op.lte] = new Date(endDate);
        }
      }

      const forecasts = await forecastData.findAll({
        where: whereClause,
        order: [
          ['date', 'ASC'],
          ['drug', 'ASC']
        ]
      });

      return forecasts.map(forecast => ({
        date: forecast.date,
        drug: forecast.drug,
        predicted_sales: forecast.predicted_sales,
        forecast_type: forecast.forecast_type,
        model_version: forecast.model_version
      }));
    } catch (error) {
      console.error('Error in getDailyForecasts:', error);
      throw error;
    }
  },

  // New method to fetch all forecast data (predicted only)
  async getAllForecasts() {
    try {
      const forecasts = await forecastData.findAll({
        order: [
          ['date', 'ASC'],
          ['drug', 'ASC']
        ]
      });

      return forecasts.map(forecast => ({
        date: forecast.date,
        drug: forecast.drug,
        predicted_sales: forecast.predicted_sales,
        forecast_type: forecast.forecast_type,
        model_version: forecast.model_version
      }));
    } catch (error) {
      console.error('Error in getAllForecasts:', error);
      throw error;
    }
  },

  async getDailyHeatmapData({ drug, startDate, endDate } = {}) {
    try {
      console.log('getDailyHeatmapData called with params:', { drug, startDate, endDate });
      
      const whereClause = {
        forecast_type: 'daily'
      };

      if (drug) {
        whereClause.drug = drug;
      }

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          const start = new Date(startDate);
          console.log('Parsed startDate:', start);
          whereClause.date[Op.gte] = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          console.log('Parsed endDate:', end);
          whereClause.date[Op.lte] = end;
        }
      }

      console.log('Final whereClause:', JSON.stringify(whereClause, null, 2));

      const forecasts = await forecastData.findAll({
        where: whereClause,
        attributes: ['date', 'drug', 'predicted_sales'],
        order: [['date', 'ASC']],
        raw: true
      });

      console.log(`Found ${forecasts.length} records`);

      if (forecasts.length === 0) {
        return {
          data: [],
          maxValue: 0
        };
      }

      // Calculate max value for scaling
      const maxValue = Math.max(...forecasts.map(f => parseFloat(f.predicted_sales)));
      console.log('Max value:', maxValue);

      // Format data for heatmap
      const formattedData = forecasts.map(forecast => {
        // Convert the date string to a proper date object
        const date = new Date(forecast.date);
        return {
          date: date.toISOString().split('T')[0],
          value: parseFloat(forecast.predicted_sales)
        };
      });

      console.log('First few formatted records:', formattedData.slice(0, 3));

      return {
        data: formattedData,
        maxValue
      };
    } catch (error) {
      console.error('Detailed error in getDailyHeatmapData:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }
};

// Export the entire service object
module.exports = forecastDataService;

