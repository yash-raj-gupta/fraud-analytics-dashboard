# Architecture

## High-level

```
┌──────────────────────────────────────────────────────────────────────┐
│                           SOURCE OF TRUTH                            │
│  dataset/transactions.csv   (100K rows)                              │
│  dataset/customers.csv      (3,500 rows)                             │
│  dataset/merchants.csv      (90 rows)                                │
└──────────────────────────────────────────────────────────────────────┘
        │                          │                          │
        ▼                          ▼                          ▼
┌──────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ SQL pipeline     │     │ Power BI report  │     │ Next.js web app    │
│ (PostgreSQL)     │     │ (.pbix)          │     │ (TypeScript)       │
│                  │     │                  │     │                    │
│ • Schema + idx   │     │ • Power Query    │     │ • lib/data.ts      │
│ • 9 query files  │     │   derived cols   │     │ • lib/analytics.ts │
│ • Risk view      │     │ • DimDate        │     │ • 6 API routes     │
│ • Anomaly z-score│     │ • DAX measures   │     │ • 5 dashboard pages│
│ • Window patterns│     │ • 4 report pages │     │ • Mock auth        │
└──────────────────┘     └──────────────────┘     └────────────────────┘
```

The three implementations are **redundant on purpose** — they reconcile to the same numbers, which is exactly the kind of cross-validation a senior analyst would build to defend a dashboard in a stakeholder review.

## Web app internals

```
app/
├── layout.tsx                Root <html> + ThemeProvider
├── page.tsx                  Redirects to /login
├── globals.css               Tailwind + CSS variables for theming
│
├── login/page.tsx            Mock auth: any email/password → localStorage session
│
├── (app)/                    Authenticated route group
│   ├── layout.tsx            AuthGuard + Sidebar shell
│   ├── dashboard/page.tsx    Server component, prerendered, KPI + multi-chart
│   ├── fraud/page.tsx        Server component, heatmap + scatter
│   ├── customers/page.tsx    Client component, fetches /api/customers
│   ├── merchants/page.tsx    Client component, fetches /api/merchants
│   └── transactions/page.tsx Client component, paginated explorer
│
└── api/
    ├── fraud-summary         KPI payload
    ├── trends                Monthly + daily + hourly + heatmap
    ├── customers             Top-200 risk ranking, filterable
    ├── merchants             Sorted, filterable
    ├── risk-score            Single customer detail + last 200 txns
    └── transactions          Paginated explorer with 10 filters
```

## Aggregation strategy

Loading and aggregating 100K rows on every request would blow the request budget. Instead:

1. `loadAll()` reads the CSVs once per Node process and parses them into a typed `Transaction[]` (~ 15 MB heap).
2. `getAnalytics()` runs the full aggregation pipeline once, producing the `AnalyticsBundle`. This bundle is memoized as a module-level singleton.
3. `dashboard` and `fraud` pages are **server components with `dynamic = "force-static"`** — Next.js prerenders them at build time, baking the analytics into static HTML.
4. Interactive pages (`customers`, `merchants`, `transactions`) hit cached API routes that read from the memoized bundle.

End result: dashboard pages serve from CDN-friendly static HTML, while interactive pages stay sub-100 ms on warmed-up server processes.

## Risk-scoring engine

Implemented in three places, all from the same formula:

```
raw_fc = fraud_count   / max(fraud_count)   × 100
raw_fa = fraud_amount  / max(fraud_amount)  × 100
raw_tf = total_txn     / max(total_txn)     × 100

risk_score = 0.5 × raw_fc + 0.3 × raw_fa + 0.2 × raw_tf
risk_level = score ≥ 80 ? High : score ≥ 50 ? Medium : Low
```

| Implementation | Location |
|---|---|
| TypeScript | `lib/analytics.ts` → `getAnalytics()` |
| SQL | `sql/06_customer_risk.sql` → `v_customer_risk` view |
| DAX | `powerbi/POWERBI_GUIDE.md` → `Risk Score` measure |

All three produce identical bucketing on the same dataset.

## Security baseline (Tier 0)

Set in `next.config.ts`:

- `Content-Security-Policy` — locked to self + safe inline (Recharts inline styles)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `robots: { index: false, follow: false }` on the analytics surface (it's behind auth in production)
- No secrets in code; mock auth never touches a database

For real banking deployment, layer on top of this:

- **SSO** (Okta / Azure AD) replacing the mock login
- **Server-side sessions** (Iron Session, Lucia, NextAuth) with HttpOnly cookies
- **Role-based access** — analyst vs ops vs viewer roles per visualization
- **PII redaction at the API layer** — mask customer names for non-elevated roles
- **Audit log** for every drill-through and CSV export

## Performance targets (NFR)

- All API routes < 200 ms warm — measured locally on M-series MacBook
- Dashboard prerendered → < 50 ms TTFB after first build
- Bundle size: heaviest route (`/customers`) at 218 kB First Load JS, others < 222 kB

## Scaling beyond 100K rows

The current in-memory layout fits comfortably in RAM up to ~5M rows. Past that, swap `lib/data.ts` for a **DuckDB** or **PostgreSQL** connection — every consumer of `loadAll()` returns plain arrays of typed records, so the swap is local. The aggregation bundle in `lib/analytics.ts` already does what would otherwise be SQL window functions, so moving the heavy lifting back into Postgres is a straight rewrite of `getAnalytics()` against the SQL views in `sql/`.
