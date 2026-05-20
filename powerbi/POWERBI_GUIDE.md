# Power BI Build Guide — FraudAnalytics

This guide reproduces the same 4-page banking dashboard described in the PRD, using the **exact CSV files generated for the web app** (`dataset/transactions.csv`, `dataset/customers.csv`, `dataset/merchants.csv`).

You can finish the whole build in roughly 60-90 minutes once you have Power BI Desktop installed.

> **Versions.** Built against Power BI Desktop September 2024 or newer. Older versions may rename a few buttons but every step still works.

---

## 0. Before you start

1. Install **Power BI Desktop** (free, Microsoft Store).
2. Locate the three CSVs produced by the web app data generator:
   - `dataset/transactions.csv` (≈ 100,000 rows)
   - `dataset/customers.csv`    (3,500 rows)
   - `dataset/merchants.csv`    (≈ 90 rows)
3. Open Power BI Desktop → **File ▸ Save As** → name it `FraudAnalytics.pbix`.

---

## 1. Import data (Power Query)

**Home ▸ Get data ▸ Text/CSV** — import each of the three files.

In **Transform Data** (Power Query Editor) make these edits per query:

### `transactions`
1. Set column types:
   - `transaction_id` → Whole Number
   - `customer_id` → Whole Number
   - `transaction_date` → Date/Time
   - `amount` → Decimal Number
   - `merchant`, `city`, `transaction_type` → Text
   - `is_fraud` → Whole Number
2. **Add Column ▸ Custom Column** — repeat for each derived column:

   | New column | Formula |
   |---|---|
   | `transaction_hour` | `Time.Hour([transaction_date])` |
   | `weekend_flag` | `if Date.DayOfWeek([transaction_date], Day.Sunday) = 0 or Date.DayOfWeek([transaction_date], Day.Sunday) = 6 then 1 else 0` |
   | `amount_category` | `if [amount] < 1000 then "Small" else if [amount] < 10000 then "Medium" else "Large"` |
   | `month_key` | `Date.ToText([transaction_date], "yyyy-MM")` |
   | `day_of_week` | `Date.DayOfWeekName([transaction_date])` |

3. **Close & Apply.**

### `customers`
- Types: `customer_id` → Whole Number, others → Text.

### `merchants`
- Types: `merchant_id` → Whole Number, others → Text.

### Build a Date table (recommended)

In Power Query → **New Source ▸ Blank Query**, paste:

```m
let
    StartDate = #date(2025, 5, 1),
    EndDate = #date(2026, 6, 1),
    Days = Duration.Days(EndDate - StartDate),
    Source = List.Dates(StartDate, Days, #duration(1,0,0,0)),
    Table = Table.FromList(Source, Splitter.SplitByNothing(), {"Date"}),
    Typed = Table.TransformColumnTypes(Table, {{"Date", type date}}),
    AddYear = Table.AddColumn(Typed, "Year", each Date.Year([Date])),
    AddMonth = Table.AddColumn(AddYear, "Month", each Date.Month([Date])),
    AddMonthName = Table.AddColumn(AddMonth, "MonthName", each Date.ToText([Date],"MMM yyyy")),
    AddYM = Table.AddColumn(AddMonthName, "YearMonth", each Date.ToText([Date],"yyyy-MM")),
    AddDOW = Table.AddColumn(AddYM, "DayOfWeek", each Date.DayOfWeekName([Date])),
    AddIsWeekend = Table.AddColumn(AddDOW, "IsWeekend",
        each if Date.DayOfWeek([Date], Day.Sunday)=0 or Date.DayOfWeek([Date], Day.Sunday)=6 then "Weekend" else "Weekday")
in
    AddIsWeekend
```

Name it `DimDate` and **Close & Apply**.

---

## 2. Model relationships (Model view)

Drag to create:

| From | To | Cardinality | Direction |
|------|----|-------------|-----------|
| `transactions[customer_id]` | `customers[customer_id]` | Many-to-one | Single |
| `transactions[merchant]` | `merchants[merchant_name]` | Many-to-one | Single |
| `Date(transactions[transaction_date])` | `DimDate[Date]` | Many-to-one | Single |

**Mark `DimDate` as the Date table** (right-click → Mark as date table → Date column).

---

## 3. DAX measures

Open **Model view** → right-click `transactions` → **New measure** for each. (You can also keep them in a dedicated `Measures` table — create with `Enter Data` → empty table named `Measures` → New measure on it; recommended.)

```DAX
-- Core counts ────────────────────────────────────────────────────────
Total Transactions =
    COUNTROWS ( transactions )

Fraud Transactions =
    CALCULATE ( COUNTROWS ( transactions ), transactions[is_fraud] = 1 )

Genuine Transactions =
    CALCULATE ( COUNTROWS ( transactions ), transactions[is_fraud] = 0 )

Fraud Percentage =
    DIVIDE ( [Fraud Transactions], [Total Transactions], 0 )

Fraud % =
    FORMAT ( [Fraud Percentage], "0.00%" )

-- Money measures ─────────────────────────────────────────────────────
Total Amount =
    SUM ( transactions[amount] )

Fraud Amount =
    CALCULATE ( SUM ( transactions[amount] ), transactions[is_fraud] = 1 )

Average Transaction Value =
    AVERAGE ( transactions[amount] )

Average Fraud Amount =
    CALCULATE ( AVERAGE ( transactions[amount] ), transactions[is_fraud] = 1 )

Fraud Amount % =
    DIVIDE ( [Fraud Amount], [Total Amount], 0 )

-- Customer counts ────────────────────────────────────────────────────
Total Customers =
    DISTINCTCOUNT ( transactions[customer_id] )

-- Risk-scoring fundamentals ──────────────────────────────────────────
Customer Fraud Count =
    CALCULATE (
        COUNTROWS ( transactions ),
        transactions[is_fraud] = 1
    )

Customer Fraud Amount =
    CALCULATE ( SUM ( transactions[amount] ), transactions[is_fraud] = 1 )

Customer Total Txns =
    COUNTROWS ( transactions )

-- Population maxima (used to normalize each component to 0..100)
Max Cust Fraud Count =
    MAXX ( VALUES ( transactions[customer_id] ), [Customer Fraud Count] )

Max Cust Fraud Amount =
    MAXX ( VALUES ( transactions[customer_id] ), [Customer Fraud Amount] )

Max Cust Total Txns =
    MAXX ( VALUES ( transactions[customer_id] ), [Customer Total Txns] )

-- Risk Score (weights: 0.5 / 0.3 / 0.2 — per PRD)
Risk Score =
    VAR fc = DIVIDE ( [Customer Fraud Count] * 100, [Max Cust Fraud Count], 0 )
    VAR fa = DIVIDE ( [Customer Fraud Amount] * 100, [Max Cust Fraud Amount], 0 )
    VAR tf = DIVIDE ( [Customer Total Txns] * 100, [Max Cust Total Txns], 0 )
    RETURN ROUND ( 0.5 * fc + 0.3 * fa + 0.2 * tf, 2 )

Risk Level =
    SWITCH (
        TRUE (),
        [Risk Score] >= 80, "High",
        [Risk Score] >= 50, "Medium",
        BLANK (),
        "Low"
    )

High-Risk Customer Count =
    COUNTROWS (
        FILTER (
            VALUES ( transactions[customer_id] ),
            [Risk Score] >= 80
        )
    )

Medium-Risk Customer Count =
    COUNTROWS (
        FILTER (
            VALUES ( transactions[customer_id] ),
            [Risk Score] >= 50 && [Risk Score] < 80
        )
    )

-- Time-intelligence ──────────────────────────────────────────────────
Fraud Txns LM =
    CALCULATE ( [Fraud Transactions], DATEADD ( DimDate[Date], -1, MONTH ) )

Fraud Txns MoM Δ =
    DIVIDE ( [Fraud Transactions] - [Fraud Txns LM], [Fraud Txns LM], BLANK () )

Fraud 3-Mo Avg =
    AVERAGEX (
        DATESINPERIOD ( DimDate[Date], MAX ( DimDate[Date] ), -3, MONTH ),
        [Fraud Transactions]
    )
```

> **Format ₹ amounts**: select each money measure → Format = `"₹"#,##0`.

---

## 4. Page-by-page build

> **Recipe per page**: drop a Page Background rectangle (Insert ▸ Shapes ▸ Rectangle) at slight padding, then place visuals on top. Use a sidebar slicer column on the left at 220 px wide.

### 4.1 — Page 1 · Executive Overview

Slicers (left rail): `DimDate[YearMonth]`, `transactions[transaction_type]`, `customers[home_city]`.

| Visual | Type | Fields |
|--------|------|--------|
| KPI · Total Transactions | Card | `[Total Transactions]` |
| KPI · Fraud Transactions | Card | `[Fraud Transactions]` |
| KPI · Fraud % | Card | `[Fraud Percentage]` |
| KPI · Total Customers | Card | `[Total Customers]` |
| KPI · Avg Transaction Value | Card | `[Average Transaction Value]` |
| Fraud trend | Line + clustered column | X: `DimDate[YearMonth]` · Columns: `[Total Transactions]`, `[Fraud Transactions]` · Line: `[Fraud Percentage]` |
| Daily transaction volume | Area | X: `DimDate[Date]` · Y: `[Total Transactions]`, `[Fraud Transactions]` |
| Fraud vs genuine | Stacked column | X: `transactions[transaction_type]` · Y: `[Genuine Transactions]`, `[Fraud Transactions]` |

Conditional formatting on **Fraud %** card: red when > 2%.

### 4.2 — Page 2 · Fraud Analysis

| Visual | Type | Fields |
|--------|------|--------|
| Fraud heatmap (day × hour) | Matrix or "HeatMap" custom visual | Rows: `DimDate[DayOfWeek]` · Columns: `transactions[transaction_hour]` · Values: `[Fraud Transactions]` |
| Region-wise fraud map | Map (built-in) or **Filled Map** | Location: `transactions[city]` · Size: `[Fraud Transactions]` · Tooltip: `[Fraud Percentage]` |
| Time-series fraud trend | Line | X: `DimDate[Date]` · Y: `[Fraud Transactions]`, `[Fraud 3-Mo Avg]` |
| Hour-wise fraud activity | Combo | X: `transactions[transaction_hour]` · Cols: `[Fraud Transactions]` · Line: `[Fraud Percentage]` |
| Fraud by category | Donut | Legend: `transactions[amount_category]` · Values: `[Fraud Amount]` |

Apply **conditional formatting → Background colour by rule** on the heatmap matrix:
- ≤ 5 → light blue, 6–20 → amber, > 20 → red. Click the 𝑓𝑥 button next to the cell colour.

### 4.3 — Page 3 · Customer Risk Segmentation

| Visual | Type | Fields |
|--------|------|--------|
| Risk distribution | Donut | Legend: `[Risk Level]` (computed col on `customers`, see below) · Values: `[Total Customers]` |
| High-risk customer table | Table | `customers[customer_id]`, `customers[customer_name]`, `customers[home_city]`, `[Customer Fraud Count]`, `[Customer Fraud Amount]`, `[Risk Score]`, `[Risk Level]` |
| Fraud amount by segment | 100% stacked bar | Axis: `[Risk Level]` · Values: `[Fraud Amount]` |
| Customer ranking | Bar chart | Axis: `customers[customer_name]` · Value: `[Risk Score]` · Top-N filter (15) |

> **Tip — materialize Risk Level on customers** (faster filtering):
> 1. Model view → `customers` → New column.
> 2. Paste:
> ```DAX
> Risk Score (calc) =
>     VAR cid = customers[customer_id]
>     VAR fc = CALCULATE ( COUNTROWS ( transactions ), transactions[is_fraud]=1, transactions[customer_id]=cid )
>     VAR fa = CALCULATE ( SUM ( transactions[amount] ),  transactions[is_fraud]=1, transactions[customer_id]=cid )
>     VAR tf = CALCULATE ( COUNTROWS ( transactions ),                                  transactions[customer_id]=cid )
>     VAR mfc = MAXX ( customers, CALCULATE ( COUNTROWS(transactions), transactions[is_fraud]=1, transactions[customer_id]=customers[customer_id] ) )
>     VAR mfa = MAXX ( customers, CALCULATE ( SUM(transactions[amount]), transactions[is_fraud]=1, transactions[customer_id]=customers[customer_id] ) )
>     VAR mtf = MAXX ( customers, CALCULATE ( COUNTROWS(transactions), transactions[customer_id]=customers[customer_id] ) )
>     RETURN ROUND ( 0.5 * DIVIDE(fc*100,mfc) + 0.3 * DIVIDE(fa*100,mfa) + 0.2 * DIVIDE(tf*100,mtf), 2 )
> ```
> 3. New column `Risk Level (calc)`:
> ```DAX
> Risk Level (calc) =
>     SWITCH ( TRUE(),
>         customers[Risk Score (calc)] >= 80, "High",
>         customers[Risk Score (calc)] >= 50, "Medium",
>         "Low"
>     )
> ```

### 4.4 — Page 4 · Merchant Intelligence

| Visual | Type | Fields |
|--------|------|--------|
| Merchant fraud % | Bar chart | Axis: `merchants[merchant_name]` · Value: `[Fraud Percentage]` · Filter top-15 by Fraud % |
| Top suspicious merchants | Table | `merchants[merchant_name]`, `[Total Transactions]`, `[Fraud Transactions]`, `[Fraud Percentage]`, `[Fraud Amount]` |
| Merchant transaction analysis | Stacked column | Axis: `merchants[category]` · Values: `[Total Transactions]`, `[Fraud Transactions]` |
| Merchant fraud trend | Line | X: `DimDate[YearMonth]` · Y: `[Fraud Transactions]` · Legend: `merchants[merchant_name]` (top-5 filter) |

Apply conditional formatting on `Fraud Percentage` cell in the table: red ≥ 10%, amber ≥ 5%, green otherwise.

---

## 5. Interactivity

- **Sync slicers** (View ▸ Sync slicers) so the date and channel slicers persist across pages.
- **Drill-through**: right-click any visual → Drill-through ▸ create a hidden page `Customer Detail` with `customers[customer_id]` as the drill target. Add KPI cards + a transactions table filtered by the drill context.
- **Bookmarks**: create one per page reset, plus a "High-risk only" bookmark with `is_fraud=1` filter applied — bind to a sidebar button.
- **Tooltips**: build a tooltip page (Format pane ▸ Page information ▸ Tooltip = on, page size = small) showing fraud KPIs; assign it to the merchant + city visuals.

---

## 6. Theme + finish

1. **View ▸ Themes ▸ Customize current theme** — paste in this banking-blue palette:

```json
{
  "name": "FraudAnalytics",
  "dataColors": ["#1f6feb","#dc2626","#d97706","#059669","#0a2a59","#475573","#b8860b"],
  "background":"#ffffff",
  "foreground":"#0f172a",
  "tableAccent":"#1f6feb"
}
```

2. Save as `FraudAnalytics-theme.json`.
3. Cards: switch to the new card visual (Format ▸ Reference label off).
4. Add a thin top-bar shape with title `FraudAnalytics — Banking Risk Intelligence` per page.
5. Add page navigator (Insert ▸ Buttons ▸ Page navigator).

---

## 7. Export

- **File ▸ Export ▸ Export to PDF** for screenshots/portfolio.
- Publish: **Home ▸ Publish** → choose a workspace → share read-only link in your README.

---

## 8. Cross-walk to the web app

| Web view | Power BI page | Same data source |
|----------|---------------|------------------|
| `/dashboard` | Page 1 — Executive Overview | ✓ |
| `/fraud` | Page 2 — Fraud Analysis | ✓ |
| `/customers` | Page 3 — Customer Risk | ✓ |
| `/merchants` | Page 4 — Merchant Intelligence | ✓ |
| `/transactions` | Drill-through page (hidden) | ✓ |

The same numbers should reconcile to within rounding between the two — useful when interviewers ask "show me how you'd validate these dashboards".
