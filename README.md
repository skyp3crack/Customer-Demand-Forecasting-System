# 💊 Customer Demand Forecasting System (FYP2)

A full-stack pharmaceutical drug sales forecasting platform powered by machine learning. The system predicts future demand across 8 drug categories using Random Forest, KNN, and XGBoost models, with results served through a REST API to an interactive React dashboard.

---

## System Architecture

```
fyp2/
├── Python ML Pipeline       Train models & generate CSV forecasts
├── backend/                 Node.js/Express REST API  (Port 3000)
└── frontend/                React 19 + Vite Dashboard (Port 3001)
```

Each tier is independent — the ML pipeline writes CSV files that the backend imports into MySQL, which the frontend then queries.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| Python | ≥ 3.9 |
| MySQL | ≥ 8.0 |

---

## Quick Start

### 1 — Python ML Pipeline

```bash
# Install dependencies
pip install -r requirements.txt

# Train all models
python train_model_saperately.py

# Generate forecasts (daily, monthly, or yearly)
python main.py daily   --days 30
python main.py monthly --months 12
python main.py all
```

### 2 — Backend API

```bash
cd backend
cp .env.example .env          # fill in DB credentials and JWT secret
npm install
npm start                     # production
npx nodemon app.js            # development (hot-reload)
```

API runs at `http://localhost:3000`.

### 3 — Frontend

```bash
cd frontend
cp .env.example .env          # set VITE_API_URL=http://localhost:3000/api
npm install
npm run dev
```

Dashboard runs at `http://localhost:3001`.

---

## Drug Categories Supported

| Code | Category |
|---|---|
| M01AB | Anti-inflammatory (acetic acid derivatives) |
| M01AE | Anti-inflammatory (propionic acid derivatives) |
| N02BA | Analgesics (salicylic acid) |
| N02BE | Analgesics (anilides) |
| N05B | Anxiolytics |
| N05C | Hypnotics / Sedatives |
| R03 | Respiratory (obstructive airway diseases) |
| R06 | Antihistamines |

---

## ML Models

Three model families are trained per drug, with and without weather features:

- **Random Forest** (`randomforest_model_*.pkl`) — primary production model
- **K-Nearest Neighbors** (`knn_model_*.pkl`)
- **XGBoost** (`xgboost_model_*.pkl`)

Trained models are stored in `saved_models/`. Forecast outputs (daily & monthly CSVs) are written to `forecasts/`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_HOST` | MySQL host |
| `DATABASE_PORT` | MySQL port (default 3306) |
| `DATABASE_USERNAME` | DB username |
| `DATABASE_PASSWORD` | DB password |
| `DATABASE_NAME` | DB name |
| `PROJECT_JWT_SECRET` | JWT signing secret (min 32 chars) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `MAIL_USERNAME` | SMTP email for notifications |
| `MAIL_PASSWORD` | SMTP password |
| `NODE_ENV` | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:3000/api`) |

---

## Key API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Email/password login |
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| GET | `/api/forecast/daily` | JWT | Daily forecast data |
| GET | `/api/forecast/monthly` | JWT | Monthly forecast data |
| GET | `/api/forecast/yearly` | JWT | Yearly aggregated data |
| GET | `/api/forecast/heatmap` | JWT | Heatmap data for a drug |
| POST | `/api/forecast/import-daily-batch` | Admin | Bulk-import daily CSVs |
| GET | `/api/drugs/available` | JWT | List all drugs |
| POST | `/api/reports/drug-performance` | Admin | Performance report |

---

## Data Sources

- `dataset/salesdaily.csv` — historical daily pharmaceutical sales
- `dataset/weather/perlis_7day.csv` — weather feature data for Perlis, Malaysia

---

## Roles

| RoleId | Name | Access |
|---|---|---|
| 1 | Admin | All routes including reports and forecast import |
| 2 | User | Read-only forecast and analytics views |
