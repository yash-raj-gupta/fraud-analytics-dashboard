-- ─────────────────────────────────────────────────────────────────────
-- FR-3 #2, #3, #4, #10 — Time, region, channel patterns
-- Concepts: CTEs, CASE, GROUP BY ROLLUP, window for rolling avgs.
-- ─────────────────────────────────────────────────────────────────────

-- 3. Monthly fraud trend (with rolling 3-month moving average via window)
WITH monthly AS (
    SELECT
        TO_CHAR(transaction_date, 'YYYY-MM')               AS month,
        COUNT(*)                                            AS total_txn,
        SUM(is_fraud)                                       AS fraud_txn,
        SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END)    AS fraud_amount
    FROM transactions
    GROUP BY 1
)
SELECT
    month,
    total_txn,
    fraud_txn,
    ROUND(100.0 * fraud_txn / NULLIF(total_txn,0), 3) AS fraud_pct,
    fraud_amount,
    ROUND(AVG(fraud_txn) OVER (
        ORDER BY month
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 1) AS fraud_3mo_avg
FROM monthly
ORDER BY month;

-- 4. Region-wise fraud rate, with totals row via ROLLUP
SELECT
    COALESCE(city, 'ALL CITIES')                         AS city,
    COUNT(*)                                              AS total_txn,
    SUM(is_fraud)                                         AS fraud_txn,
    ROUND(100.0 * SUM(is_fraud)/NULLIF(COUNT(*),0), 3)    AS fraud_pct,
    SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END)      AS fraud_amount
FROM transactions
GROUP BY ROLLUP(city)
ORDER BY (city IS NULL), fraud_pct DESC;

-- 10. Time-based fraud patterns: hour-of-day × weekend
WITH hourly AS (
    SELECT
        transaction_hour,
        weekend_flag,
        COUNT(*)        AS total_txn,
        SUM(is_fraud)   AS fraud_txn
    FROM transactions
    GROUP BY transaction_hour, weekend_flag
)
SELECT
    transaction_hour                                  AS hour_utc,
    SUM(CASE WHEN weekend_flag=0 THEN fraud_txn END)  AS weekday_fraud,
    SUM(CASE WHEN weekend_flag=1 THEN fraud_txn END)  AS weekend_fraud,
    ROUND(100.0 * SUM(fraud_txn)/NULLIF(SUM(total_txn),0), 3) AS fraud_pct
FROM hourly
GROUP BY transaction_hour
ORDER BY transaction_hour;

-- Channel split with fraud rate
SELECT
    transaction_type,
    COUNT(*)                                                AS total_txn,
    SUM(is_fraud)                                            AS fraud_txn,
    ROUND(100.0 * SUM(is_fraud)/NULLIF(COUNT(*),0), 3)       AS fraud_pct,
    ROUND(AVG(amount), 2)                                    AS avg_amount,
    SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END)         AS fraud_amount
FROM transactions
GROUP BY transaction_type
ORDER BY fraud_pct DESC;
