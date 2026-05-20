-- ─────────────────────────────────────────────────────────────────────
-- FR-3 #7, #9 — Anomaly + high-value fraud detection
-- Concepts: window functions for per-customer baselines, z-score,
--           subqueries, LAG for velocity checks.
-- ─────────────────────────────────────────────────────────────────────

-- 7. Transaction amount anomaly via z-score (per-customer baseline)
WITH cust_stats AS (
    SELECT
        customer_id,
        AVG(amount)                                       AS mu,
        NULLIF(STDDEV_SAMP(amount), 0)                    AS sigma,
        COUNT(*)                                          AS n
    FROM transactions
    GROUP BY customer_id
)
SELECT
    t.transaction_id,
    t.customer_id,
    t.transaction_date,
    t.amount,
    t.merchant,
    t.transaction_type,
    t.is_fraud,
    ROUND(((t.amount - s.mu) / s.sigma)::NUMERIC, 2) AS z_score
FROM transactions t
JOIN cust_stats   s USING (customer_id)
WHERE s.n >= 5
  AND ABS((t.amount - s.mu) / s.sigma) > 3
ORDER BY z_score DESC
LIMIT 100;

-- 9. High-value fraud transactions
SELECT
    transaction_id,
    customer_id,
    transaction_date,
    amount,
    merchant,
    city,
    transaction_type
FROM transactions
WHERE is_fraud = 1
ORDER BY amount DESC
LIMIT 25;

-- Velocity check: customers with multiple fraud txns in <24h via LAG
WITH ordered AS (
    SELECT
        customer_id,
        transaction_id,
        transaction_date,
        amount,
        is_fraud,
        LAG(transaction_date) OVER (PARTITION BY customer_id ORDER BY transaction_date)
            AS prev_date,
        LAG(is_fraud)         OVER (PARTITION BY customer_id ORDER BY transaction_date)
            AS prev_is_fraud
    FROM transactions
)
SELECT
    customer_id,
    transaction_id,
    transaction_date,
    amount,
    EXTRACT(EPOCH FROM (transaction_date - prev_date))/3600 AS hrs_since_prev
FROM ordered
WHERE is_fraud = 1
  AND prev_is_fraud = 1
  AND transaction_date - prev_date < INTERVAL '24 hours'
ORDER BY hrs_since_prev
LIMIT 50;
