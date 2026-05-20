# SQL Pipeline — FraudAnalytics

PostgreSQL 14+ is the reference target. Run scripts in this order:

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

## What each file delivers

| File | FR coverage | SQL concepts |
|------|-------------|--------------|
| `01_schema.sql` | FR-2 | DDL, constraints, view |
| `02_load_data.sql` | FR-1, FR-2 | `\copy`, derived columns |
| `03_indexes.sql` | NFR query speed | composite indexes, ANALYZE |
| `04_kpi_queries.sql` | FR-4 | CTE, conditional sum |
| `05_fraud_analysis.sql` | FR-3 #2-4, #10 | CTE, window AVG, ROLLUP |
| `06_customer_risk.sql` | FR-5, FR-3 #5, #8 | RANK, NTILE, CASE, MERGE-style update |
| `07_merchant_analysis.sql` | FR-3 #6 | RANK, DENSE_RANK, PERCENT_RANK |
| `08_anomaly_detection.sql` | FR-3 #7, #9 | z-score, LAG velocity check |
| `09_window_functions.sql` | bonus | running totals, cohorts, lift |

## Cross-database notes

- **MySQL 8+**: replace `EXTRACT(DOW FROM …)` with `DAYOFWEEK(…)-1`, replace `STDDEV_SAMP` with `STDDEV`, drop the `\connect` line, use `LOAD DATA INFILE`.
- **SQL Server**: replace `TO_CHAR(…)` with `FORMAT(…, 'yyyy-MM')`, `EXTRACT` with `DATEPART`, `INTERVAL '24 hours'` with `DATEADD(HOUR, -24, …)`. ROLLUP works as-is. Use `BULK INSERT` for the load step.
