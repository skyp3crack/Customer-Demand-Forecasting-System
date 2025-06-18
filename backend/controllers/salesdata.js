const salesDataService = require('../services/salesDataService');

const salesDataController = {
  // Import sales data from CSV
  async importData(req, res) {
    // console.log('Import request received:', {
    //   file: req.file ? {
    //     filename: req.file.filename,
    //     path: req.file.path,
    //     size: req.file.size,
    //     mimetype: req.file.mimetype
    //   } : 'No file'
    // });

    if (!req.file) {
      return res.status(400).json({ 
        error: true, 
        message: 'No file uploaded' 
      });
    }

    try {
      // console.log('Starting data import from file:', req.file.path);
      const result = await salesDataService.importSalesData(req.file.path);
      // console.log('Import completed successfully:', result);
      
      res.json({
        error: false,
        message: 'Data imported successfully',
        data: result
      });
    } catch (error) {
      // console.error('Detailed error in importData:', {
      //   message: error.message,
      //   stack: error.stack,
      //   file: req.file ? req.file.path : 'No file'
      // });
      
      res.status(500).json({ 
        error: true, 
        message: 'Error importing data',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Get sales data with filters
  async getSalesData(req, res) {
    try {
      const { drug, startDate, endDate, year, month } = req.query;
      const data = await salesDataService.getSalesData({ 
        drug, 
        startDate, 
        endDate, 
        year, 
        month 
      });
      res.json({
        error: false,
        data: data
      });
    } catch (error) {
      // console.error('Error in getSalesData:', error);
      res.status(500).json({ 
        error: true, 
        message: 'Error fetching sales data',
        details: error.message 
      });
    }
  }
};

module.exports = salesDataController;
