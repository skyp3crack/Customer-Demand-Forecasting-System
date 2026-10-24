// Static demo mode: replaces the Express/MySQL backend with pre-generated JSON from
// /demo-data (see scripts/build-demo-data.mjs). Enabled with VITE_STATIC_DEMO=true.
import { AxiosError } from 'axios';

export const IS_DEMO = import.meta.env.VITE_STATIC_DEMO === 'true';
export const PORTFOLIO_URL = 'https://my-portfolio-khalif-amin.vercel.app/projects';

const DEMO_USER = {
  id: 1,
  email: 'demo@pharmforecast.app',
  name: 'Demo Admin',
  RoleId: 1,
  image: 'profile-image.jpg',
};

const files = {};
const load = (name) => {
  files[name] ??= fetch(`${import.meta.env.BASE_URL}demo-data/${name}.json`).then((r) => {
    if (!r.ok) throw new Error(`Failed to load demo data: ${name}`);
    return r.json();
  });
  return files[name];
};

const day = (iso) => String(iso).slice(0, 10);
const inRange = (date, start, end) => (!start || day(date) >= day(start)) && (!end || day(date) <= day(end));
const asList = (v) => (Array.isArray(v) ? v : v ? String(v).split(',') : []);

const fail = (config, status, message) =>
  Promise.reject(new AxiosError(message, String(status), config, null, {
    status, statusText: message, data: { success: false, message }, headers: {}, config,
  }));

const readOnly = (config) => fail(config, 403, 'This is a read-only demo; changes are disabled.');

const csv = (rows) =>
  ['date,drug,type,value', ...rows.map((r) => `${day(r.date)},${r.drug},${r.type},${r.value}`)].join('\n');

const actualRows = (actual, drugs, start, end) => {
  const rows = [];
  actual.dates.forEach((date, i) => {
    if (!inRange(date, start, end)) return;
    for (const drug of drugs) {
      if (actual.values[drug]) rows.push({ date, drug, value: actual.values[drug][i], type: 'actual' });
    }
  });
  return rows;
};

const forecastRows = async (drugs, start, end) => {
  const [monthly, daily] = await Promise.all([load('monthly'), load('daily')]);
  return [...monthly, ...daily]
    .filter((r) => drugs.includes(r.drug) && inRange(r.date, start, end))
    .map((r) => ({
      date: r.date, drug: r.drug, value: r.predicted_sales, type: 'forecast',
      forecastType: r.forecast_type, modelVersion: r.model_version,
    }));
};

const yearly = (monthly) => {
  const sums = new Map();
  for (const r of monthly) {
    const key = `${r.date.slice(0, 4)}|${r.drug}`;
    sums.set(key, (sums.get(key) ?? 0) + r.predicted_sales);
  }
  return [...sums].map(([key, total]) => {
    const [year, drug] = key.split('|');
    return { date: year, drug, predicted_sales: Math.round(total * 100) / 100, forecast_type: 'yearly', model_version: 'rf' };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.drug.localeCompare(b.drug));
};

const routes = {
  'GET /auth/verify': async () => ({ success: true, user: DEMO_USER }),
  'GET /users/me': async () => DEMO_USER,
  'GET /users/profile': async () => DEMO_USER,
  'POST /auth/logout': async () => ({ success: true }),

  'GET /drugs/available': async () => ({ success: true, data: await load('drugs') }),
  'GET /drugs/search': async ({ query = '' }) => {
    const q = String(query).toLowerCase();
    const data = (await load('drugs')).filter((d) => d.toLowerCase().includes(q)).slice(0, 10);
    return { success: true, data: data.map((d) => ({ id: d, name: d, code: d })) };
  },

  'GET /forecast/monthly': async ({ drug, startDate, endDate }) =>
    (await load('monthly')).filter((r) => (!drug || r.drug === drug) && inRange(r.date, startDate, endDate)),
  'GET /forecast/daily': async ({ drug, startDate, endDate }) =>
    (await load('daily')).filter((r) => (!drug || r.drug === drug) && inRange(r.date, startDate, endDate)),
  'GET /forecast/yearly': async ({ drug }) =>
    yearly((await load('monthly')).filter((r) => !drug || r.drug === drug)),
  'GET /forecast/historical/all': async () => {
    const [monthly, daily] = await Promise.all([load('monthly'), load('daily')]);
    return [...monthly, ...daily];
  },

  'GET /drugs/combined-report': async (p) => {
    const drugs = asList(p.drugIds);
    const [actual, forecast] = await Promise.all([
      load('actual'),
      p.forecastStart || p.forecastEnd ? forecastRows(drugs, p.forecastStart, p.forecastEnd) : [],
    ]);
    return { success: true, data: { actual: actualRows(actual, drugs, p.actualStart, p.actualEnd), forecast } };
  },
  'GET /drugs/export-report': async (p) => {
    const drugs = asList(p.drugIds);
    const actual = actualRows(await load('actual'), drugs, p.actualStart, p.actualEnd);
    const forecast = p.forecastStart && p.forecastEnd ? await forecastRows(drugs, p.forecastStart, p.forecastEnd) : [];
    const rows = [...actual, ...forecast];
    return String(p.format).toLowerCase() === 'json' ? JSON.stringify({ actual, forecast }, null, 2) : csv(rows);
  },
};

export const demoAdapter = async (config) => {
  const path = String(config.url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '').split('?')[0];
  const method = (config.method || 'get').toUpperCase();
  const handler = routes[`${method} ${path}`];

  if (!handler) return method === 'GET' ? fail(config, 404, `No demo data for ${path}`) : readOnly(config);

  const query = Object.fromEntries(new URLSearchParams(String(config.url).split('?')[1] ?? ''));
  const data = await handler({ ...query, ...config.params }).catch((e) => fail(config, 500, e.message));
  return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
};

// Make the app believe a user is signed in, so the protected routes render.
export const ensureDemoSession = () => {
  try {
    localStorage.setItem('token', 'demo-token');
  } catch {
    // storage unavailable: the app falls back to the login page
  }
};
