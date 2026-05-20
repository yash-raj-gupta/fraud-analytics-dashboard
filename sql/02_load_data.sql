-- ─────────────────────────────────────────────────────────────────────
-- Load CSVs (PostgreSQL syntax)
-- Adjust the absolute paths to where you placed the dataset/ folder.
-- ─────────────────────────────────────────────────────────────────────

\copy customers(customer_id, customer_name, home_city)
  FROM 'dataset/customers.csv' WITH (FORMAT CSV, HEADER TRUE);

\copy merchants(merchant_id, merchant_name, category)
  FROM 'dataset/merchants.csv' WITH (FORMAT CSV, HEADER TRUE);

\copy transactions(transaction_id, customer_id, transaction_date, amount, merchant, city, transaction_type, is_fraud)
  FROM 'dataset/transactions.csv' WITH (FORMAT CSV, HEADER TRUE);

-- Backfill derived columns for the fact table
UPDATE transactions
SET
  transaction_hour = EXTRACT(HOUR FROM transaction_date)::INT,
  weekend_flag     = CASE WHEN EXTRACT(DOW FROM transaction_date) IN (0,6) THEN 1 ELSE 0 END,
  amount_category  = CASE
                       WHEN amount < 1000   THEN 'Small'
                       WHEN amount < 10000  THEN 'Medium'
                       ELSE 'Large'
                     END;

-- Quick sanity check
SELECT
    COUNT(*)                            AS row_count,
    SUM(is_fraud)                       AS fraud_count,
    ROUND(100.0 * SUM(is_fraud)/COUNT(*), 2) AS fraud_pct,
    SUM(amount)                         AS total_amount,
    SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END) AS fraud_amount
FROM transactions;
