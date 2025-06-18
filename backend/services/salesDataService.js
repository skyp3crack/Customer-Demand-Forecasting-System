const { Op } = require('sequelize');
const { salesData } = require('../models');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const salesDataService = {
  async importSalesData(filePath) {
    // console.log('Starting importSalesData service with file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    try {
      const results = [];
      const invalidRecords = [];
      let rowCount = 0;
      
      // Read and parse CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => {
            rowCount++;
            // console.log(`Processing row ${rowCount}`);
            
            // Process each drug column
            const drugColumns = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06'];
            
            drugColumns.forEach(drug => {
              if (data[drug] !== undefined && data[drug] !== '') {
                try {
                  const salesValue = parseFloat(data[drug]);
                  if (!isNaN(salesValue)) {
                    results.push({
                      drug,
                      date: data.datum,
                      actual_sales: salesValue,
                      year: parseInt(data.Year),
                      month: parseInt(data.Month),
                      hour: parseInt(data.Hour),
                      weekday_name: data['Weekday Name']
                    });
                  } else {
                    // console.warn(`Invalid sales value for ${drug} on ${data.datum}: ${data[drug]}`);
                    invalidRecords.push({
                      drug,
                      date: data.datum,
                      value: data[drug],
                      reason: 'Invalid sales value'
                    });
                  }
                } catch (error) {
                  // console.error(`Error processing row for ${drug}:`, error);
                  invalidRecords.push({
                    drug,
                    date: data.datum,
                    value: data[drug],
                    reason: error.message
                  });
                }
              }
            });
          })
          .on('end', () => {
            // console.log(`Finished processing ${rowCount} rows`);
            resolve();
          })
          .on('error', (error) => {
            // console.error('Error reading CSV:', error);
            reject(error);
          });
      });

      // console.log(`Attempting to bulk create ${results.length} records`);
      
      // Bulk create records
      const createdRecords = await salesData.bulkCreate(results, {
        fields: ['drug', 'date', 'actual_sales', 'year', 'month', 'hour', 'weekday_name'],
        updateOnDuplicate: ['actual_sales', 'year', 'month', 'hour', 'weekday_name']
      });

      // console.log(`Successfully created/updated ${createdRecords.length} records`);

      return {
        totalRecords: results.length,
        importedRecords: createdRecords.length,
        invalidRecords,
        message: 'Sales data imported successfully'
      };
    } catch (error) {
      // console.error('Error in importSalesData service:', {
      //   message: error.message,
      //   stack: error.stack,
      //   filePath
      // });
      throw error;
    }
  },

  async getSalesData({ drug, startDate, endDate, year, month } = {}) {
    try {
      const whereClause = {};

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

      if (year) {
        whereClause.year = year;
      }

      if (month) {
        whereClause.month = month;
      }

      const sales = await salesData.findAll({
        where: whereClause,
        order: [
          ['date', 'ASC'],
          ['drug', 'ASC']
        ]
      });

      return sales.map(record => ({
        date: record.date,
        drug: record.drug,
        actual_sales: record.actual_sales,
        year: record.year,
        month: record.month,
        hour: record.hour,
        weekday_name: record.weekday_name
      }));
    } catch (error) {
      // console.error('Error fetching sales data:', error);
      throw error;
    }
  }
};

module.exports = salesDataService;
