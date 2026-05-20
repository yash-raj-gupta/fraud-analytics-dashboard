# DAX Reference — copy/paste

Standalone copy of every measure used in the dashboard, for quick reference / portfolio embed.

```DAX
Total Transactions       = COUNTROWS ( transactions )
Fraud Transactions       = CALCULATE ( COUNTROWS ( transactions ), transactions[is_fraud] = 1 )
Genuine Transactions     = CALCULATE ( COUNTROWS ( transactions ), transactions[is_fraud] = 0 )
Fraud Percentage         = DIVIDE ( [Fraud Transactions], [Total Transactions], 0 )
Fraud %                  = FORMAT ( [Fraud Percentage], "0.00%" )

Total Amount             = SUM ( transactions[amount] )
Fraud Amount             = CALCULATE ( SUM ( transactions[amount] ), transactions[is_fraud] = 1 )
Average Transaction Value= AVERAGE ( transactions[amount] )
Average Fraud Amount     = CALCULATE ( AVERAGE ( transactions[amount] ), transactions[is_fraud] = 1 )
Fraud Amount %           = DIVIDE ( [Fraud Amount], [Total Amount], 0 )

Total Customers          = DISTINCTCOUNT ( transactions[customer_id] )
Customer Fraud Count     = CALCULATE ( COUNTROWS ( transactions ), transactions[is_fraud] = 1 )
Customer Fraud Amount    = CALCULATE ( SUM ( transactions[amount] ), transactions[is_fraud] = 1 )
Customer Total Txns      = COUNTROWS ( transactions )

Max Cust Fraud Count     = MAXX ( VALUES ( transactions[customer_id] ), [Customer Fraud Count] )
Max Cust Fraud Amount    = MAXX ( VALUES ( transactions[customer_id] ), [Customer Fraud Amount] )
Max Cust Total Txns      = MAXX ( VALUES ( transactions[customer_id] ), [Customer Total Txns] )

Risk Score =
    VAR fc = DIVIDE ( [Customer Fraud Count] * 100, [Max Cust Fraud Count], 0 )
    VAR fa = DIVIDE ( [Customer Fraud Amount] * 100, [Max Cust Fraud Amount], 0 )
    VAR tf = DIVIDE ( [Customer Total Txns] * 100, [Max Cust Total Txns], 0 )
    RETURN ROUND ( 0.5 * fc + 0.3 * fa + 0.2 * tf, 2 )

Risk Level =
    SWITCH ( TRUE (),
        [Risk Score] >= 80, "High",
        [Risk Score] >= 50, "Medium",
        "Low"
    )

High-Risk Customer Count =
    COUNTROWS (
        FILTER ( VALUES ( transactions[customer_id] ), [Risk Score] >= 80 )
    )

Medium-Risk Customer Count =
    COUNTROWS (
        FILTER ( VALUES ( transactions[customer_id] ), [Risk Score] >= 50 && [Risk Score] < 80 )
    )

Fraud Txns LM            = CALCULATE ( [Fraud Transactions], DATEADD ( DimDate[Date], -1, MONTH ) )
Fraud Txns MoM Δ         = DIVIDE ( [Fraud Transactions] - [Fraud Txns LM], [Fraud Txns LM], BLANK () )
Fraud 3-Mo Avg           = AVERAGEX ( DATESINPERIOD ( DimDate[Date], MAX ( DimDate[Date] ), -3, MONTH ), [Fraud Transactions] )
```
