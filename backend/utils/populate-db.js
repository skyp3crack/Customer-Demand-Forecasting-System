const path = require('path');
const forecastDataService = require('../services/forecastDataService');
const fs = require('fs');

async function importAll() {
  console.log('Starting data import...');
  const forecastsDir = path.join(__dirname, '../forecasts');

  // Import monthly data
  const monthlyFile = path.join(forecastsDir, 'monthly_forecast_rf_202501.csv');
  if (fs.existsSync(monthlyFile)) {
    console.log(`Importing ${monthlyFile}`);
    try {
      await forecastDataService.importForecastData(monthlyFile);
      console.log('Monthly import successful.');
    } catch (err) {
      console.error('Error importing monthly:', err.message);
    }
  }

  // Import daily data for 2025 and 2026
  const years = ['2025', '2026'];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  for (const year of years) {
    for (const month of months) {
      const fileName = `daily_forecast_rf_${year}${month}01.csv`;
      const dailyFile = path.join(forecastsDir, fileName);
      if (fs.existsSync(dailyFile)) {
        console.log(`Importing ${fileName}`);
        try {
          await forecastDataService.importForecastData(dailyFile);
        } catch (err) {
          console.error(`Error importing ${fileName}:`, err.message);
        }
      }
    }
  }

  console.log('Data import complete!');
  process.exit(0);
}

importAll();
