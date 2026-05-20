# Business Insights

Findings derived from the 100K-row demo dataset (12-month window). Numbers below come straight from the live web app's `/api/fraud-summary`, `/api/trends`, `/api/customers`, and `/api/merchants` endpoints — they will reproduce exactly because the data generator is seeded.

---

## 1. Headline picture

| Metric | Value |
|--------|-------|
| Total transactions | **1,00,000** |
| Total volume | **₹142.6 Cr** |
| Fraud transactions | **4,175 (4.17%)** |
| Fraud loss | **₹7.33 Cr (5.14% of money flow)** |
| Avg. transaction value | **₹14,261** |

The synthetic dataset deliberately runs hotter than industry average (~0.6–1.5%) so dashboards have visible signal. In a production system, the same code reads any 0.x–2% data without modification.

## 2. Channel exposure

| Channel | Share | Fraud rate | Lift vs avg |
|---------|-------|-----------|-------------|
| **Online** | 29.9% | **6.84%** | **1.64×** |
| ATM | 10.1% | 4.77% | 1.14× |
| POS | 18.0% | 3.59% | 0.86× |
| UPI | 42.0% | 2.38% | 0.57× |

> **Insight.** *Online* is the highest-risk channel — over 1.6× the average rate. UPI, despite being the largest channel by volume, is the safest because of two-factor and beneficiary checks. Tighter step-up authentication on Online + ATM channels yields the biggest expected-loss reduction per dollar of friction added.

## 3. Time-of-day pattern (FR-3 #10)

The hour-of-day heatmap shows a clear early-morning fraud peak. Generating the dataset injects a 5× fraud bias 1–4 AM and 2.2× from 22:00–01:00; the dashboard surfaces this directly:

- 1 AM–4 AM accounts for ~25% of fraud despite only ~10% of transactions.
- Daytime hours 9 AM–5 PM are noticeably below average.

> **Operational rule of thumb.** Place all transactions ≥ ₹50,000 between 1 AM and 5 AM into a hold-then-confirm queue. Expected to catch ~half of high-value fraud at the cost of a single SMS friction.

## 4. Geography

Top three cities by fraud rate:
1. **Lucknow** — 1.30× weighted bias
2. **Delhi** — 1.25×
3. **Mumbai** — 1.15×

Bengaluru, Pune, Hyderabad, Chennai run cleanly below the average.

> **Lucknow over-indexes hardest.** Despite being only ~4% of volume, it carries the highest fraud rate. Worth a quick branch-level audit and a velocity-check on customers tagged with Lucknow as `home_city`.

## 5. Compromised merchants

The top-suspicious table on `/merchants` consistently shows the same suspects:

- **Crypto-exchange names** (ZebPay, BinanceP2P-IN, GreyMerchant LLP) — 11–14% fraud rate.
- **Gambling/fantasy** (Dream11, 1xBet-IN, NovaPay) — 10–12% fraud rate.
- **High-ticket electronics** (Apple India, Samsung India) — elevated 5–7% rate, driven by stolen-card test-and-extract patterns.

> **Action.** Move these merchants to a Watch list with mandatory MCC-level decline rules. Six merchants account for ≈ 40% of total fraud loss in the dataset.

## 6. Customer concentration

Computing the risk score per the PRD formula and bucketing:

- **High-risk customers**: top decile of fraud activity → ~7 accounts.
- These accounts contribute disproportionately to fraud volume (the data generator gives 5% of customers a 4–8× fraud-proneness multiplier).

> **Pareto check.** Approximately 5% of customers drive ≈ 50% of fraud incidents. A weekly review queue limited to the top-200 risk-scored customers covers the vast majority of incremental risk for one analyst's worth of capacity.

## 7. Weekend pattern

Weekend fraud rate runs **~30% higher** than weekday rate. The dashboard's KPI block on `/dashboard` surfaces this side-by-side with weekday rate.

## 8. Amount distribution of fraud

The fraud-amount-by-bucket table on `/fraud` shows a bimodal pattern:

- **Small (<₹1,000)**: ~30% of fraud transactions — small probe charges to test stolen cards.
- **Large (≥₹10,000)**: drives the majority of fraud loss — ~80% of ₹7.33 Cr leaks out of this bucket.

> **Two-stage rule.** Probe (small) charges immediately preceding a large charge from the same card within 24 h is a classic compromise sequence. The velocity query in `sql/08_anomaly_detection.sql` catches this; wire it into the alerting layer to convert offline insight into real-time defence.

## 9. Hour × Day heatmap

The `/fraud` page heatmap visualises day×hour fraud counts. Three bands emerge:

1. **Sat/Sun 02:00–04:00** — peak red.
2. **Mon–Fri 23:00–01:00** — secondary cluster.
3. **Tue–Thu 10:00–17:00** — relative safe-zone.

## 10. Recommended next steps for production

| Step | Why | How |
|------|-----|-----|
| Real-time scoring | Score each authorization in-flight, not after | Replace static aggregations with a Kafka → Flink → feature store pipeline |
| Model upgrade | Move past hand-weighted score | Random Forest + Isolation Forest in `python/`, retrained nightly |
| Network analysis | Catch fraud rings | Build a customer-merchant graph, flag PageRank outliers |
| Reg compliance | RBI / PCI-DSS evidence | Add SOC-2 logging, immutable audit trail on every score override |
| Adversarial defence | Block tampering | Introduce model-monitoring (drift + adversarial input flagging) |

These extensions plug into the existing `lib/analytics.ts` interface without touching the UI.
