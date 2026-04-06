/**
 * seed-and-populate.js
 * 
 * Combined idempotent seed script for production deployment.
 * Runs on every deploy (via render-start) but only inserts data if tables are empty.
 * 
 * Steps:
 *   1. Ensure all tables exist (sync as safety net)
 *   2. Seed roles (admin, user)
 *   3. Import forecast CSV data
 *   4. Import historical sales data from salesdaily.csv
 */

const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

// ─── Config ───────────────────────────────────────────────────
const FORECASTS_DIR = path.join(__dirname, '../../forecasts');
const SALES_CSV = path.join(__dirname, '../../dataset/salesdaily.csv');
const DRUG_CODES = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06'];
const BATCH_SIZE = 500;

// ─── Helpers ──────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const [m, d, y] = str.split('/');
  if (!m || !d || !y) return null;
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

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Seed & Populate starting...\n');

  // Import models AFTER environment is set
  const db = require('../models');
  const { sequelize, Role, forecastData, salesData } = db;

  try {
    await sequelize.authenticate();
    console.log('  ✓ Database connected');

    // Safety net: ensure all tables exist even if migrations had issues
    // alter: false means it won't modify existing tables, just create missing ones
    console.log('  → Ensuring tables exist...');
    await sequelize.sync({ alter: false });
    console.log('  ✓ Tables verified\n');

    // ─── 1. Seed Roles ───────────────────────────────────
    const roleCount = await Role.count();
    if (roleCount === 0) {
      const now = new Date();
      await Role.bulkCreate([
        { id: 1, name: 'admin', createdAt: now, updatedAt: now },
        { id: 2, name: 'user', createdAt: now, updatedAt: now },
      ]);
      console.log('  ✓ Roles: created admin + user');
    } else {
      console.log(`  ✓ Roles: already seeded (${roleCount})`);
    }

    // ─── 2. Import Forecast CSVs ─────────────────────────
    const forecastCount = await forecastData.count();
    if (forecastCount > 0) {
      console.log(`  ✓ Forecasts: already populated (${forecastCount} rows)`);
    } else if (!fs.existsSync(FORECASTS_DIR)) {
      console.log('  ⚠ Forecasts dir not found, skipping');
    } else {
      // Try importing via forecastDataService
      try {
        const forecastService = require('../services/forecastDataService');
        const csvFiles = fs.readdirSync(FORECASTS_DIR).filter(f => f.endsWith('.csv'));
        let imported = 0;
        for (const file of csvFiles) {
          try {
            await forecastService.importForecastData(path.join(FORECASTS_DIR, file));
            imported++;
          } catch (e) { /* skip duplicate/invalid files */ }
        }
        const finalCount = await forecastData.count();
        console.log(`  ✓ Forecasts: imported ${imported} files (${finalCount} rows total)`);
      } catch (e) {
        console.log(`  ⚠ Forecast import failed: ${e.message}`);
      }
    }

    // ─── 3. Import Sales Data ────────────────────────────
    const salesCount = await salesData.count();
    if (salesCount > 0) {
      console.log(`  ✓ Sales: already populated (${salesCount} rows)`);
    } else if (!fs.existsSync(SALES_CSV)) {
      console.log('  ⚠ salesdaily.csv not found, skipping');
    } else {
      const rawRows = await readCsv(SALES_CSV);
      const rows = [];

      for (const raw of rawRows) {
        const date = parseDate(raw['datum']);
        if (!date) continue;

        const year = parseInt(raw['Year']) || 0;
        const month = parseInt(raw['Month']) || 0;
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

    console.log('\n✅ Seed & Populate complete!\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err.stack);
    // Don't exit with error code — let the app start even if seeding fails
  }

  await sequelize.close();
}

main();
