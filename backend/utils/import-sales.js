/**
 * import-sales.js
 * Imports salesdaily.csv (wide format) into the salesData table (long format).
 * Columns: datum, M01AB, M01AE, N02BA, N02BE, N05B, N05C, R03, R06, Year, Month, Hour, Weekday Name
 */

const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { sequelize, salesData } = require('../models');

const CSV_PATH = path.join(__dirname, '../../dataset/salesdaily.csv');
const DRUG_CODES = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06'];
const BATCH_SIZE = 500;

function parseDate(str) {
  // Format: M/D/YYYY  e.g. "1/2/2014"
  const [m, d, y] = str.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

async function run() {
  await sequelize.authenticate();
  console.log('DB connected. Reading CSV...');

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (raw) => {
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
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Parsed ${rows.length} records. Inserting in batches of ${BATCH_SIZE}...`);

  // Insert in batches using bulkCreate (much faster than individual inserts)
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await salesData.bulkCreate(batch, { ignoreDuplicates: true });
    inserted += batch.length;
    process.stdout.write(`\rInserted ${inserted}/${rows.length}`);
  }

  console.log(`\nDone! Imported ${inserted} sales records.`);
  await sequelize.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
