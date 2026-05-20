-- ─────────────────────────────────────────────────────────────────────
-- FR-5: Risk scoring + FR-3 #5, #8 (high-risk customers, ranking)
-- Concepts: CTE, window functions (RANK, NTILE, PERCENT_RANK),
--           CASE for classification, MERGE-style update.
-- ─────────────────────────────────────────────────────────────────────

-- View materializing per-customer fraud aggregates
CREATE OR REPLACE VIEW v_customer_stats AS
SELECT
    t.customer_id,
    COUNT(*)                                            AS total_txn,
    SUM(t.is_fraud)                                     AS fraud_count,
    SUM(CASE WHEN t.is_fraud=1 THEN t.amount END)       AS fraud_amount,
    SUM(t.amount)                                       AS total_amount
FROM transactions t
GROUP BY t.customer_id;

-- Risk score using PRD weights (0.5 fraud_count + 0.3 fraud_amount + 0.2 frequency)
-- Each component normalized to 0-100 against the population max.
CREATE OR REPLACE VIEW v_customer_risk AS
WITH stats AS (
    SELECT
        s.customer_id,
        s.total_txn,
        COALESCE(s.fraud_count, 0)   AS fraud_count,
        COALESCE(s.fraud_amount, 0)  AS fraud_amount,
        s.total_amount,
        MAX(s.fraud_count)  OVER ()  AS max_fc,
        MAX(s.fraud_amount) OVER ()  AS max_fa,
        MAX(s.total_txn)    OVER ()  AS max_tf
    FROM v_customer_stats s
),
scored AS (
    SELECT
        customer_id,
        total_txn,
        fraud_count,
        fraud_amount,
        total_amount,
        ROUND(
            0.5 * (100.0 * fraud_count  / NULLIF(max_fc,0))
          + 0.3 * (100.0 * fraud_amount / NULLIF(max_fa,0))
          + 0.2 * (100.0 * total_txn    / NULLIF(max_tf,0))
        , 2) AS risk_score
    FROM stats
)
SELECT
    customer_id,
    total_txn,
    fraud_count,
    fraud_amount,
    total_amount,
    risk_score,
    CASE
        WHEN risk_score >= 80 THEN 'High'
        WHEN risk_score >= 50 THEN 'Medium'
        ELSE 'Low'
    END AS risk_level
FROM scored;

-- Persist the score back onto the customers dimension
UPDATE customers c
SET risk_score = r.risk_score,
    risk_level = r.risk_level
FROM v_customer_risk r
WHERE c.customer_id = r.customer_id;

-- Top-N high-risk customers (FR-3 #5, #8)
SELECT
    RANK() OVER (ORDER BY r.risk_score DESC) AS risk_rank,
    NTILE(10) OVER (ORDER BY r.risk_score DESC) AS risk_decile,
    c.customer_id,
    c.customer_name,
    c.home_city,
    r.total_txn,
    r.fraud_count,
    r.fraud_amount,
    r.risk_score,
    r.risk_level
FROM v_customer_risk r
JOIN customers c ON c.customer_id = r.customer_id
ORDER BY r.risk_score DESC
LIMIT 50;

-- Rank fraud count by city using window functions
SELECT
    c.home_city,
    c.customer_name,
    r.fraud_count,
    DENSE_RANK() OVER (PARTITION BY c.home_city ORDER BY r.fraud_count DESC) AS city_rank
FROM v_customer_risk r
JOIN customers c ON c.customer_id = r.customer_id
WHERE r.fraud_count > 0
ORDER BY c.home_city, city_rank
LIMIT 100;
