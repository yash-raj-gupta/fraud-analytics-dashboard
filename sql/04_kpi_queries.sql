-- ─────────────────────────────────────────────────────────────────────
-- FR-4: Headline KPIs
-- Concepts: aggregation, conditional sums, CTEs.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Total transactions, fraud count, fraud %, total amount, fraud amount
WITH base AS (
    SELECT COUNT(*)                                      AS total_txn,
           SUM(is_fraud)                                  AS fraud_txn,
           SUM(amount)                                    AS total_amount,
           SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END) AS fraud_amount,
           AVG(amount)                                    AS avg_txn_value
    FROM transactions
)
SELECT
    total_txn,
    fraud_txn,
    ROUND(100.0 * fraud_txn / NULLIF(total_txn,0), 3) AS fraud_pct,
    ROUND(avg_txn_value, 2)                           AS avg_txn_value,
    total_amount,
    fraud_amount,
    ROUND(100.0 * fraud_amount / NULLIF(total_amount,0), 3) AS fraud_amount_pct
FROM base;

-- 2. High-risk customer count (using risk view from 06_customer_risk.sql)
SELECT COUNT(*) AS high_risk_customers
FROM customers
WHERE risk_level = 'High';
