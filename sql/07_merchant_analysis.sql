-- ─────────────────────────────────────────────────────────────────────
-- FR-3 #6: Merchant fraud analysis
-- Concepts: CTE, window functions (RANK, PERCENT_RANK),
--           HAVING to floor minimum sample size.
-- ─────────────────────────────────────────────────────────────────────

WITH merchant_stats AS (
    SELECT
        merchant,
        COUNT(*)                                            AS total_txn,
        SUM(is_fraud)                                       AS fraud_txn,
        SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END)    AS fraud_amount,
        SUM(amount)                                         AS total_amount
    FROM transactions
    GROUP BY merchant
    HAVING COUNT(*) >= 50  -- exclude merchants with too-thin samples
)
SELECT
    merchant,
    total_txn,
    fraud_txn,
    ROUND(100.0 * fraud_txn / NULLIF(total_txn,0), 3) AS fraud_pct,
    fraud_amount,
    total_amount,
    RANK()         OVER (ORDER BY (1.0*fraud_txn/NULLIF(total_txn,0)) DESC) AS rank_by_rate,
    DENSE_RANK()   OVER (ORDER BY fraud_amount DESC)                        AS rank_by_loss,
    PERCENT_RANK() OVER (ORDER BY (1.0*fraud_txn/NULLIF(total_txn,0)))      AS percentile_rank,
    CASE
        WHEN 1.0*fraud_txn/NULLIF(total_txn,0) > 0.10 THEN 'Critical'
        WHEN 1.0*fraud_txn/NULLIF(total_txn,0) > 0.05 THEN 'Elevated'
        WHEN 1.0*fraud_txn/NULLIF(total_txn,0) > 0.02 THEN 'Watch'
        ELSE 'Normal'
    END AS surveillance_status
FROM merchant_stats
ORDER BY fraud_pct DESC
LIMIT 50;

-- Update fraud_cases on merchants dimension for use in dashboards
UPDATE merchants m
SET fraud_cases = sub.fraud_txn
FROM (
    SELECT merchant, SUM(is_fraud) AS fraud_txn
    FROM transactions
    GROUP BY merchant
) sub
WHERE m.merchant_name = sub.merchant;

-- Merchant fraud trend (12 months)
SELECT
    merchant,
    TO_CHAR(transaction_date, 'YYYY-MM') AS month,
    COUNT(*)              AS total_txn,
    SUM(is_fraud)         AS fraud_txn
FROM transactions
WHERE merchant IN (
    SELECT merchant
    FROM transactions
    GROUP BY merchant
    ORDER BY SUM(is_fraud) DESC
    LIMIT 10
)
GROUP BY merchant, month
ORDER BY merchant, month;
