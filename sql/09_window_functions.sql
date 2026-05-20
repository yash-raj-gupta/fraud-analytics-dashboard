-- ─────────────────────────────────────────────────────────────────────
-- Showcase queries for advanced window-function patterns.
-- Useful as teaching/portfolio assets.
-- ─────────────────────────────────────────────────────────────────────

-- Running total of fraud amount over time
SELECT
    DATE_TRUNC('day', transaction_date) AS day,
    SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END) AS daily_fraud_amount,
    SUM(SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END))
        OVER (ORDER BY DATE_TRUNC('day', transaction_date))
        AS running_fraud_amount
FROM transactions
GROUP BY 1
ORDER BY 1;

-- Top 5 merchants by fraud each month (filter window result with QUALIFY-like CTE)
WITH monthly_merchant AS (
    SELECT
        TO_CHAR(transaction_date, 'YYYY-MM') AS month,
        merchant,
        SUM(is_fraud) AS fraud_txn,
        SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END) AS fraud_amount
    FROM transactions
    GROUP BY 1, 2
),
ranked AS (
    SELECT
        month,
        merchant,
        fraud_txn,
        fraud_amount,
        RANK() OVER (PARTITION BY month ORDER BY fraud_amount DESC) AS rk
    FROM monthly_merchant
)
SELECT month, merchant, fraud_txn, fraud_amount
FROM ranked
WHERE rk <= 5
ORDER BY month, rk;

-- Customer cohort: % of fraud committed by top decile
WITH ranked AS (
    SELECT
        customer_id,
        SUM(is_fraud) AS fraud_count,
        NTILE(10) OVER (ORDER BY SUM(is_fraud) DESC) AS decile
    FROM transactions
    GROUP BY customer_id
)
SELECT
    decile,
    COUNT(*)                                                AS customers,
    SUM(fraud_count)                                         AS fraud_count,
    ROUND(100.0 * SUM(fraud_count) /
          SUM(SUM(fraud_count)) OVER (), 2)                  AS pct_of_total_fraud
FROM ranked
GROUP BY decile
ORDER BY decile;

-- Per-channel fraud rate vs. global, with ratio
SELECT
    transaction_type,
    SUM(is_fraud)::FLOAT / COUNT(*)                            AS channel_rate,
    (SELECT SUM(is_fraud)::FLOAT / COUNT(*) FROM transactions) AS global_rate,
    ROUND(
        (SUM(is_fraud)::NUMERIC / COUNT(*)) /
        NULLIF((SELECT SUM(is_fraud)::NUMERIC / COUNT(*) FROM transactions), 0)
    , 2) AS lift_vs_global
FROM transactions
GROUP BY transaction_type
ORDER BY lift_vs_global DESC;
