const { Op } = require('sequelize');
const m = require('../models');

/**
 * Fetches sales or forecast data from the database
 * @param {Array} drugs - Array of drug codes to fetch
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} type - Type of data to fetch ('actual' or 'forecast')
 * @returns {Promise<Array>} Array of data records
 */
async function getSalesData(drugs, startDate, endDate, type = 'actual') {
  console.log(`=== getSalesData Debug (${type}) ===`);
  console.log(`Fetching ${type} data for drugs:`, drugs);
  console.log(`Date range: ${startDate} to ${endDate}`);

  const where = {
    drug: { [Op.in]: drugs },
    date: {}
  };

  if (startDate) where.date[Op.gte] = new Date(startDate);
  if (endDate) where.date[Op.lte] = new Date(endDate);

  // Use salesData model for actual, forecastData for forecast
  const model = type === 'actual' ? m.salesData : m.forecastData;
  
  console.log(`Using model: ${model.name}`);
  console.log('Where clause:', JSON.stringify(where, null, 2));
  
  try {
    const results = await model.findAll({
      where,
      order: [['date', 'ASC']],
      raw: true
    });
    
    console.log(`Found ${results.length} ${type} records`);
    if (results.length > 0) {
      console.log('Sample record:', JSON.stringify(results[0]));
    }
    
    return results;
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    throw error;
  }
}

/**
 * Exports data as CSV
 * @param {Object} res - Express response object
 * @param {Array} data - Data to export
 * @returns {void}
 */
function exportAsCSV(res, data) {
  try {
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'No data to export' });
    }

    // Get headers from first item
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV rows
    const csvRows = [];
    csvRows.push(headers.join(',')); // Add header row
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = ('' + value).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    // Set headers and send response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
    return res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error in exportAsCSV:', error);
    throw error;
  }
}

/**
 * Exports data as JSON
 * @param {Object} res - Express response object
 * @param {Array} data - Data to export
 * @returns {void}
 */
function exportAsJSON(res, data) {
  try {
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'No data to export' });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=report.json');
    return res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error in exportAsJSON:', error);
    throw error;
  }
}

/**
 * Exports combined actual and forecast data as CSV in a pivot table format
 * @param {Object} res - Express response object
 * @param {Object} params - Object containing actual, forecast data and metadata
 * @param {Array} params.actual - Array of actual data records
 * @param {Array} params.forecast - Array of forecast data records
 * @param {Object} params.metadata - Metadata about the export
 * @returns {void}
 */
function exportCombinedAsCSV(res, { actual, forecast, metadata }) {
  try {
    console.log('=== exportCombinedAsCSV Debug ===');
    console.log('Actual data sample:', actual && actual.length > 0 ? actual[0] : 'No actual data');
    console.log('Forecast data sample:', forecast && forecast.length > 0 ? forecast[0] : 'No forecast data');
    
    const drugs = [...new Set([...actual, ...forecast].map(item => item.drug))];
    console.log('Unique drugs found:', drugs);
    
    const allRows = [];
    
    // Add metadata as comments
    allRows.push(`# Generated: ${metadata.exportDate || new Date().toISOString()}`);
    allRows.push(`# Exported by: ${metadata.exportedBy || 'unknown'}`);
    allRows.push(`# Drugs: ${drugs.join(', ')}`);
    allRows.push(`# Actual Range: ${metadata.actualDateRange.start} to ${metadata.actualDateRange.end}`);
    
    if (metadata.forecastDateRange) {
      allRows.push(`# Forecast Range: ${metadata.forecastDateRange.start} to ${metadata.forecastDateRange.end}`);
    }
    
    // Create a map to store all dates and their values
    const dateMap = new Map();
    
    // Process actual data
    if (actual && actual.length > 0) {
      actual.forEach(item => {
        const date = new Date(item.date).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, actual: {}, forecast: {} });
        }
        const value = item.actual_sales !== undefined ? item.actual_sales :
                    (item.quantity !== undefined ? item.quantity : item.value);
        dateMap.get(date).actual[item.drug] = value;
      });
    }
    
    // Process forecast data
    if (forecast && forecast.length > 0) {
      forecast.forEach(item => {
        const date = new Date(item.date).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, actual: {}, forecast: {} });
        }
        const value = item.predicted_sales !== undefined ? item.predicted_sales :
                    (item.value !== undefined ? item.value : item.quantity);
        dateMap.get(date).forecast[item.drug] = value;
      });
    }
    
    // Convert map to array and sort by date
    const sortedDates = Array.from(dateMap.keys()).sort();
    
    // Create header row
    const headers = ['Date'];
    drugs.forEach(drug => {
      headers.push(`Actual (${drug})`);
      headers.push(`Forecast (${drug})`);
    });
    allRows.push(headers.join(','));
    
    // Add data rows
    sortedDates.forEach(date => {
      const rowData = dateMap.get(date);
      const row = [date];
      
      drugs.forEach(drug => {
        // Add actual value or empty if not available
        row.push(rowData.actual[drug] !== undefined ? rowData.actual[drug] : '');
        // Add forecast value or empty if not available
        row.push(rowData.forecast[drug] !== undefined ? rowData.forecast[drug] : '');
      });
      
      allRows.push(row.join(','));
    });
    
    console.log('Final CSV row count:', allRows.length - 4); // Subtract header and comment rows
    
    // Send response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=drug_report.csv');
    res.send(allRows.join('\n'));
  } catch (error) {
    console.error('Error in exportCombinedAsCSV:', error);
    throw error;
  }
}

module.exports = {
  getSalesData,
  exportAsCSV,
  exportAsJSON,
  exportCombinedAsCSV
};
