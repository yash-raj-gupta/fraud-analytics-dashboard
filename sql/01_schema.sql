-- ─────────────────────────────────────────────────────────────────────
-- FraudAnalytics — Schema
-- Tested on PostgreSQL 14+ (works with minor edits on MySQL / SQL Server)
-- ─────────────────────────────────────────────────────────────────────

CREATE DATABASE FraudAnalytics;
\connect FraudAnalytics

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;

-- Reference dimension: customers
CREATE TABLE customers (
    customer_id     INT PRIMARY KEY,
    customer_name   VARCHAR(120) NOT NULL,
    home_city       VARCHAR(60)  NOT NULL,
    -- populated by the risk-scoring procedure / view
    risk_score      NUMERIC(5,2),
    risk_level      VARCHAR(10)
);

-- Reference dimension: merchants
CREATE TABLE merchants (
    merchant_id     INT PRIMARY KEY,
    merchant_name   VARCHAR(120) UNIQUE NOT NULL,
    category        VARCHAR(40)  NOT NULL,
    fraud_cases     INT DEFAULT 0
);

-- Fact table: transactions
CREATE TABLE transactions (
    transaction_id    BIGINT PRIMARY KEY,
    customer_id       INT NOT NULL REFERENCES customers(customer_id),
    transaction_date  TIMESTAMP NOT NULL,
    amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    merchant          VARCHAR(120) NOT NULL,
    city              VARCHAR(60)  NOT NULL,
    transaction_type  VARCHAR(20)  NOT NULL
                       CHECK (transaction_type IN ('UPI','Online','POS','ATM')),
    is_fraud          SMALLINT NOT NULL CHECK (is_fraud IN (0,1)),
    -- derived columns (computed at load time)
    transaction_hour  SMALLINT,
    weekend_flag      SMALLINT,
    amount_category   VARCHAR(10),
    risk_level        VARCHAR(10)
);

-- Optional view that strips reporting columns
CREATE OR REPLACE VIEW v_transactions_clean AS
SELECT
    transaction_id,
    customer_id,
    transaction_date,
    amount,
    merchant,
    city,
    transaction_type,
    is_fraud,
    EXTRACT(HOUR FROM transaction_date)::INT AS transaction_hour,
    CASE WHEN EXTRACT(DOW FROM transaction_date) IN (0,6) THEN 1 ELSE 0 END AS weekend_flag,
    CASE
        WHEN amount < 1000   THEN 'Small'
        WHEN amount < 10000  THEN 'Medium'
        ELSE 'Large'
    END AS amount_category
FROM transactions;
