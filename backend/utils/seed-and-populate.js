/**
 * seed-and-populate.js
 * 
 * Combined idempotent seed script for production deployment.
 * Runs on every deploy (via render-start) but only inserts data if tables are empty.
 * 
 * Steps:
 *   1. Seed roles (admin, user)
 *   2. Import forecast CSV data (monthly + daily for 2025-2027)
 *   3. Import historical sales data from salesdaily.csv
 */

const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { sequelize, Role, salesData, forecastData } = require('../models');

// ─── Config ───────────────────────────────────────────────────
const FORECASTS_DIR = path.join(__dirname, '../../forecasts');
const SALES_CSV = path.join(__dirname, '../../dataset/salesdaily.csv');
const DRUG_CODES = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06'];
const BATCH_SIZE = 500;

// ─── Helpers ──────────────────────────────────────────────────
function parseDate(str) {
  const [m, d, y] = str.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function bulkInsert(model, rows, label) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await model.bulkCreate(batch, { ignoreDuplicates: true });
    inserted += batch.length;
  }
  console.log(`  ✓ ${label}: ${inserted} rows`);
}

// ─── 1. Seed Roles ───────────────────────────────────────────
async function seedRoles() {
  const count = await Role.count();
  if (count > 0) {
    console.log('  ✓ Roles: already seeded');
    return;
  }

  const now = new Date();
  await Role.bulkCreate([
    { id: 1, name: 'admin', createdAt: now, updatedAt: now },
    { id: 2, name: 'user', createdAt: now, updatedAt: now },
  ]);
  console.log('  ✓ Roles: created admin + user');
}

// ─── 2. Import Forecast CSVs ─────────────────────────────────
async function importForecasts() {
  const count = await forecastData.count();
  if (count > 0) {
    console.log(`  ✓ Forecasts: already populated (${count} rows)`);
    return;
  }

  if (!fs.existsSync(FORECASTS_DIR)) {
    console.log('  ⚠ Forecasts dir not found, skipping');
    return;
  }

  const forecastService = require('../services/forecastDataService');
  const years = ['2025', '2026', '2027'];
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];

  // Monthly forecasts
  for (const file of ['monthly_forecast_rf_202501.csv', 'monthly_forecast_rf_202506.csv']) {
    const fp = path.join(FORECASTS_DIR, file);
    if (fs.existsSync(fp)) {
      try {
        await forecastService.importForecastData(fp);
        console.log(`  ✓ Imported ${file}`);
      } catch (e) {
        console.log(`  ⚠ Skipped ${file}: ${e.message}`);
      }
    }
  }

  // Daily forecasts
  for (const year of years) {
    for (const month of months) {
      const file = `daily_forecast_rf_${year}${month}01.csv`;
      const fp = path.join(FORECASTS_DIR, file);
      if (fs.existsSync(fp)) {
        try {
          await forecastService.importForecastData(fp);
        } catch (e) { /* skip if duplicate or missing */ }
      }
    }
  }
  
  const finalCount = await forecastData.count();
  console.log(`  ✓ Forecasts: ${finalCount} rows total`);
}

// ─── 3. Import Sales Data ────────────────────────────────────
async function importSales() {
  const count = await salesData.count();
  if (count > 0) {
    console.log(`  ✓ Sales: already populated (${count} rows)`);
    return;
  }

  if (!fs.existsSync(SALES_CSV)) {
    console.log('  ⚠ salesdaily.csv not found, skipping');
    return;
  }

  const rawRows = await readCsv(SALES_CSV);
  const rows = [];

  for (const raw of rawRows) {
    const date = parseDate(raw['datum']);
    const year = parseInt(raw['Year']);
    const month = parseInt(raw['Month']);
    const hour = parseInt(raw['Hour']) || 0;
    const weekday_name = raw['Weekday Name'] || '';

    for (const drug of DRUG_CODES) {
      const val = parseFloat(raw[drug]);
      if (!isNaN(val)) {
        rows.push({ drug, date, actual_sales: val, year, month, hour, weekday_name });
      }
    }
  }

  await bulkInsert(salesData, rows, 'Sales');
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Seed & Populate starting...\n');

  try {
    await sequelize.authenticate();
    console.log('  ✓ Database connected\n');

    await seedRoles();
    await importForecasts();
    await importSales();

    console.log('\n✅ Seed & Populate complete!\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    // Don't exit with error — allow the app to start even if seeding fails
    // The app will work, just without pre-loaded data
  }

  await sequelize.close();
}

main();
