# Dashboard Page Wireframes

Use these as a reference when arranging visuals in Power BI.
Every page is sized for **1280 × 760** (Desktop). Drop a 16-px grid in View ▸ Gridlines.

---

## Page 1 — Executive Overview

```
┌──────────┬────────────────────────────────────────────────┐
│ Title    │   Total Tx   Fraud Tx   Fraud %   Cust   AvgValue│
│ + bar    ├────────────────────────────────────────────────┤
│ slicers  │  ┌─────────────────────┐ ┌────────────────────┐│
│  YearMo  │  │ Monthly fraud trend │ │ Risk amount totals ││
│  Channel │  │ (combo chart)       │ │ + weekend split    ││
│  City    │  └─────────────────────┘ └────────────────────┘│
│          │  ┌─────────────────────┐ ┌────────────────────┐│
│          │  │ Daily volume area   │ │ Fraud vs Genuine   ││
│          │  └─────────────────────┘ │ (channel)          ││
│          │  ┌─────────────────────┐ └────────────────────┘│
│          │  │ Region fraud bar    │ │ Top suspicious     ││
│          │  └─────────────────────┘ │ merchant table     ││
└──────────┴───────────────────────────┴────────────────────┘
```

## Page 2 — Fraud Analysis

```
┌──────────┬───────────────────────────────────────────────┐
│ Insights │  Day × Hour Heatmap (matrix)                  │
│ "Peak"   ├──────────────────────┬────────────────────────┤
│ "Region" │ Hourly fraud (combo) │ Region fraud bar       │
│ "Bucket" ├──────────────────────┴────────────────────────┤
│          │  Anomaly scatter (built with Z-score column)   │
│          ├───────────────────────────────────────────────┤
│          │  Amount bucket distribution table              │
└──────────┴───────────────────────────────────────────────┘
```

## Page 3 — Customer Risk

```
┌──────────┬────────────────────────────────────────────┐
│ slicers  │ Donut: Risk distribution    Bar: Fraud $$$ │
│ YearMo   │                              by segment    │
│ Risk Lvl ├────────────────────────────────────────────┤
│ City     │ Top 200 customer ranking table             │
│          │   – Drill-through enabled                  │
└──────────┴────────────────────────────────────────────┘
```

## Page 4 — Merchant Intelligence

```
┌──────────┬─────────────────────┬─────────────────────┐
│ slicers  │ Merchant fraud %    │ Top suspicious      │
│ YearMo   │ bar (top 15)        │ merchant table      │
│ Category ├─────────────────────┴─────────────────────┤
│          │ Stacked column: Tx by category            │
│          ├───────────────────────────────────────────┤
│          │ Multi-line: Top-5 merchant fraud trend    │
└──────────┴───────────────────────────────────────────┘
```

## Hidden — Customer Drill-through

Page sized 600 × 800. Top: customer name, ID, city, risk level pill.
Below: KPI strip (Fraud count, Fraud amount, Total tx, Risk score) → table of last 50 transactions.
Right-click any visual on Pages 1–3 → Drill through → Customer Detail.
