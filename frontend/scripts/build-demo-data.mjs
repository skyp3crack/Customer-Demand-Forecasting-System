// Converts the ML pipeline's CSV outputs into static JSON for the backend-less demo build.
// Run from the frontend folder:  npm run demo:data
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'frontend', 'public', 'demo-data');
mkdirSync(out, { recursive: true });

const DRUGS = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06'];

const readCsv = (file) => {
  const [head, ...lines] = readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const cols = head.split(',');
  return lines.map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])));
};
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00.000Z`;
const round = (n) => Math.round(parseFloat(n) * 100) / 100;

// Monthly: later files override earlier ones for the same month (mirrors the DB import).
const forecastDir = join(root, 'forecasts');
const monthly = new Map();
for (const f of readdirSync(forecastDir).filter((f) => /^monthly_forecast_rf_\d{6}\.csv$/.test(f)).sort()) {
  for (const r of readCsv(join(forecastDir, f))) {
    for (const drug of DRUGS) {
      const date = iso(r.Year, r.Month, 1);
      monthly.set(`${date}|${drug}`, {
        date, drug, predicted_sales: round(r[drug]), forecast_type: 'monthly', model_version: 'rf',
      });
    }
  }
}
const monthlyRows = [...monthly.values()].sort((a, b) => a.date.localeCompare(b.date) || a.drug.localeCompare(b.drug));

const daily = new Map(); // later files override earlier ones, like the DB import
for (const f of readdirSync(forecastDir).filter((f) => /^daily_forecast_rf_\d{8}\.csv$/.test(f)).sort()) {
  for (const r of readCsv(join(forecastDir, f))) {
    const [y, m, d] = r.Date.split('-');
    const date = iso(y, m, d);
    daily.set(`${date}|${r.Drug}`, {
      date, drug: r.Drug, predicted_sales: round(r.Predicted_Sales),
      forecast_type: 'daily', model_version: 'rf',
    });
  }
}
const dailyRows = [...daily.values()];
dailyRows.sort((a, b) => a.date.localeCompare(b.date) || a.drug.localeCompare(b.drug));

// Historical actuals, stored column-wise to keep the file small.
const sales = readCsv(join(root, 'dataset', 'salesdaily.csv'));
const actual = { drugs: DRUGS, dates: [], values: Object.fromEntries(DRUGS.map((d) => [d, []])) };
for (const r of sales) {
  const [m, d, y] = r.datum.split('/');
  actual.dates.push(iso(y, m, d));
  for (const drug of DRUGS) actual.values[drug].push(round(r[drug]));
}

const model = readCsv(join(root, 'test_set_metrics.csv')).map((r) => ({
  drug: r.Drug, model: r.Model, r2: +r.R2, rmse: +r.RMSE, mae: +r.MAE, mape: +r.MAPE,
}));

const write = (name, data) => writeFileSync(join(out, name), JSON.stringify(data));
write('drugs.json', DRUGS);
write('monthly.json', monthlyRows);
write('daily.json', dailyRows);
write('actual.json', actual);
write('model-metrics.json', model);
console.log(`drugs=${DRUGS.length} monthly=${monthlyRows.length} daily=${dailyRows.length} actual days=${actual.dates.length} metrics=${model.length}`);
