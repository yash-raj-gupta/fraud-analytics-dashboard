# FraudAnalytics — Credit Card Fraud & Customer Risk Analytics Platform

End-to-end portfolio build covering everything in the PRD:
**SQL pipeline → Power BI dashboard → Next.js web application**, all driven by the same 100K-row synthetic banking dataset.

---

## What's in here

```
fraud-analytics/
├── app/                  Next.js 15 (App Router) — 5 dashboard pages + 6 API routes + login
├── components/           Sidebar, KPI card, theme toggle, 8 chart components
├── lib/                  Data layer + analytics aggregations + risk scoring + utils
├── dataset/              Synthetic data generator + transactions / customers / merchants CSVs
├── sql/                  PostgreSQL schema, indexes, and 9 advanced query files
├── powerbi/              Step-by-step Power BI build guide + DAX reference + theme JSON
├── docs/                 Architecture overview + business insights
└── public/               Static assets
```

## Live demo (local)

```bash
# 1. Generate the dataset (idempotent — produces deterministic output)
node dataset/generate.mjs

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
# → open http://localhost:3000  (or 3001 if 3000 is busy)
# → use any email/password on the login page
```

## Production build

```bash
npm run build && npm start
```

The app prerenders the analytics pages on build (the heavy aggregation runs once) and stays under 220 kB First Load JS per route.

---

## Architecture

```
                   ┌─────────────┐
   transactions.csv │             │ ┌─ /api/fraud-summary  ─┐
   customers.csv  ─►│ lib/data    │ ├─ /api/trends          │
   merchants.csv    │ + analytics │ ├─ /api/customers       │   ┌───────────────┐
                   │             │ ├─ /api/merchants       ├──►│ React pages    │
                   │ in-memory   │ ├─ /api/risk-score      │   │ + Recharts     │
                   │ aggregator  │ └─ /api/transactions    ┘   └───────────────┘
                   └─────────────┘
```

- **Single-source dataset.** The same CSVs feed the SQL pipeline, the Power BI report, and the web app — so reconciliation across the three is a quick smoke test.
- **In-memory aggregation.** `lib/analytics.ts` runs once per server process, bundling KPIs, monthly trends, hourly fraud, region rates, merchant ranking, customer risk, heatmap cells, weekend split, and amount-bucket breakdowns.
- **Risk scoring.** Implements the PRD weights: `0.5 × fraud_count + 0.3 × fraud_amount + 0.2 × txn_frequency`, each component min-max normalized to 0–100. Buckets at 80 / 50 / 0 → High / Medium / Low.

## Pages

| Route | What it shows |
|-------|---------------|
| `/login` | Banking-style sign-in (mock auth — any email/password works) |
| `/dashboard` | Executive overview · 5 KPI cards · monthly trend · daily volume · channel split · region fraud · top-suspicious merchants |
| `/fraud` | Pattern detection · day×hour heatmap · hourly fraud · region bar · log-scale amount/hour scatter · amount bucket distribution |
| `/customers` | Risk segmentation · risk distribution donut · top-200 ranking with search + filter + drill |
| `/merchants` | Merchant intelligence · top fraud-rate bar · sortable surveillance table with badges |
| `/transactions` | Transaction explorer · 10 filters · sortable, paginated, CSV export |
| `/methodology` | In-app analytical writeup — risk-score weights, KPI rationale, data assumptions, limitations, v2 roadmap |

## SQL pipeline

```bash
psql -f sql/01_schema.sql
psql -d FraudAnalytics -f sql/02_load_data.sql
psql -d FraudAnalytics -f sql/03_indexes.sql
psql -d FraudAnalytics -f sql/04_kpi_queries.sql
psql -d FraudAnalytics -f sql/05_fraud_analysis.sql
psql -d FraudAnalytics -f sql/06_customer_risk.sql
psql -d FraudAnalytics -f sql/07_merchant_analysis.sql
psql -d FraudAnalytics -f sql/08_anomaly_detection.sql
psql -d FraudAnalytics -f sql/09_window_functions.sql
```

All 10 required analyses (FR-3) are covered. See `sql/README.md` for the cross-walk.

## Power BI build

Open `powerbi/POWERBI_GUIDE.md` — it's a 60–90 minute walk-through covering:

- Importing the same CSVs and adding derived columns in Power Query
- Building a `DimDate` table
- Setting up the model relationships
- Every DAX measure used in the dashboard (also in `powerbi/DAX_MEASURES.md`)
- All 4 report pages with field-by-field instructions
- Drill-through, slicers, conditional formatting, theme

The bundled `powerbi/FraudAnalytics-theme.json` matches the web app's banking palette.

---

## Stack

- **Framework**: Next.js 15 (App Router, server components by default, prerendered analytics pages)
- **UI**: Tailwind CSS, Recharts, lucide-react, next-themes (dark/light/system)
- **Data**: Pure TypeScript in-memory aggregator over CSV (no external DB required for the demo)
- **Languages**: TypeScript end-to-end + ANSI SQL
- **Security baseline (Tier 0)**: full CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy strict-origin, Permissions-Policy locked, `robots: noindex` on the analytics surface

## Deploy

Vercel works out of the box (push the repo + import). For the dataset, either:
1. Commit the `dataset/*.csv` files (easiest), or
2. Generate them at build time by adding `npm run generate:data` to the build pipeline.

The CSV-loading aggregator runs once at first request and stays resident. For >1M-row workloads, swap `lib/data.ts` for a Postgres / DuckDB connection — the public surface (API routes + analytics functions) doesn't need to change.

---

## Resume one-liner

> Designed and shipped a banking fraud analytics platform end-to-end: SQL data model with window-function risk scoring, Power BI executive dashboard with custom DAX, and a responsive Next.js web app — all reconciled against a 100K-row credit card transaction dataset.

## License

MIT — sample/portfolio code, no production warranties.
