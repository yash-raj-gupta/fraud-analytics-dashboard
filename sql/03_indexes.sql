-- ─────────────────────────────────────────────────────────────────────
-- Indexes for sub-5-second analytical queries on 100K+ rows.
-- (Targets the predicates / GROUP BYs in 04–09.)
-- ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_txn_date          ON transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_txn_customer      ON transactions (customer_id);
CREATE INDEX IF NOT EXISTS idx_txn_merchant      ON transactions (merchant);
CREATE INDEX IF NOT EXISTS idx_txn_city          ON transactions (city);
CREATE INDEX IF NOT EXISTS idx_txn_type          ON transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_txn_isfraud       ON transactions (is_fraud);
CREATE INDEX IF NOT EXISTS idx_txn_hour          ON transactions (transaction_hour);

-- Composite for the most common filter combos
CREATE INDEX IF NOT EXISTS idx_txn_fraud_date    ON transactions (is_fraud, transaction_date);
CREATE INDEX IF NOT EXISTS idx_txn_cust_fraud    ON transactions (customer_id, is_fraud);
CREATE INDEX IF NOT EXISTS idx_txn_merch_fraud   ON transactions (merchant, is_fraud);

ANALYZE transactions;
ANALYZE customers;
ANALYZE merchants;
