// Aggregations + risk scoring on top of the data layer.
// Everything here is computed once on first load and memoized.

import { loadAll, type Transaction, type RiskLevel } from "./data";

export interface KpiSummary {
  totalTransactions: number;
  fraudTransactions: number;
  fraudPercentage: number;
  totalCustomers: number;
  totalMerchants: number;
  averageTransactionValue: number;
  totalFraudAmount: number;
  totalAmount: number;
  highRiskCustomers: number;
  mediumRiskCustomers: number;
  lowRiskCustomers: number;
}

export interface MonthlyPoint {
  month: string;
  total: number;
  fraud: number;
  fraudAmount: number;
  totalAmount: number;
  fraudRate: number;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  total: number;
  fraud: number;
  totalAmount: number;
}

export interface HourlyPoint {
  hour: number;
  total: number;
  fraud: number;
  fraudRate: number;
}

export interface CityFraud {
  city: string;
  total: number;
  fraud: number;
  fraudAmount: number;
  fraudRate: number;
}

export interface MerchantFraud {
  merchant: string;
  total: number;
  fraud: number;
  fraudAmount: number;
  fraudRate: number;
  totalAmount: number;
}

export interface CustomerRisk {
  customer_id: number;
  customer_name: string;
  home_city: string;
  total: number;
  fraudCount: number;
  fraudAmount: number;
  totalAmount: number;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface TypeFraud {
  type: string;
  total: number;
  fraud: number;
  fraudRate: number;
}

export interface HeatmapCell {
  day: number; // 0–6 (Sun..Sat)
  hour: number; // 0–23
  fraud: number;
  total: number;
}

export interface AnalyticsBundle {
  kpi: KpiSummary;
  monthly: MonthlyPoint[];
  daily: DailyPoint[];
  hourly: HourlyPoint[];
  cities: CityFraud[];
  merchants: MerchantFraud[];
  topRiskCustomers: CustomerRisk[];
  txnTypes: TypeFraud[];
  heatmap: HeatmapCell[];
  amountCategories: { category: string; total: number; fraud: number; fraudAmount: number }[];
  riskBuckets: { level: RiskLevel; count: number; fraudAmount: number }[];
  weekendVsWeekday: { weekend: { total: number; fraud: number }; weekday: { total: number; fraud: number } };
}

let bundle: AnalyticsBundle | null = null;

function classifyRisk(score: number): RiskLevel {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function getAnalytics(): AnalyticsBundle {
  if (bundle) return bundle;
  const { transactions, customers } = loadAll();

  // ── Top-level KPI ────────────────────────────────────────────────────
  const totalTransactions = transactions.length;
  let fraudTransactions = 0;
  let totalAmount = 0;
  let totalFraudAmount = 0;
  for (const t of transactions) {
    totalAmount += t.amount;
    if (t.is_fraud) {
      fraudTransactions++;
      totalFraudAmount += t.amount;
    }
  }

  // ── Monthly trend ────────────────────────────────────────────────────
  const monthlyMap = new Map<string, MonthlyPoint>();
  for (const t of transactions) {
    let p = monthlyMap.get(t.month);
    if (!p) {
      p = { month: t.month, total: 0, fraud: 0, fraudAmount: 0, totalAmount: 0, fraudRate: 0 };
      monthlyMap.set(t.month, p);
    }
    p.total++;
    p.totalAmount += t.amount;
    if (t.is_fraud) {
      p.fraud++;
      p.fraudAmount += t.amount;
    }
  }
  const monthly = [...monthlyMap.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((p) => ({ ...p, fraudRate: p.total ? p.fraud / p.total : 0 }));

  // ── Daily volume (last 90 days for the dashboard sparkline) ──────────
  const dailyMap = new Map<string, DailyPoint>();
  for (const t of transactions) {
    const dayKey = t.transaction_date.slice(0, 10);
    let p = dailyMap.get(dayKey);
    if (!p) {
      p = { date: dayKey, total: 0, fraud: 0, totalAmount: 0 };
      dailyMap.set(dayKey, p);
    }
    p.total++;
    p.totalAmount += t.amount;
    if (t.is_fraud) p.fraud++;
  }
  const daily = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  // ── Hourly fraud activity ────────────────────────────────────────────
  const hourly: HourlyPoint[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    total: 0,
    fraud: 0,
    fraudRate: 0,
  }));
  for (const t of transactions) {
    hourly[t.hour].total++;
    if (t.is_fraud) hourly[t.hour].fraud++;
  }
  hourly.forEach((p) => (p.fraudRate = p.total ? p.fraud / p.total : 0));

  // ── City fraud ───────────────────────────────────────────────────────
  const cityMap = new Map<string, CityFraud>();
  for (const t of transactions) {
    let p = cityMap.get(t.city);
    if (!p) {
      p = { city: t.city, total: 0, fraud: 0, fraudAmount: 0, fraudRate: 0 };
      cityMap.set(t.city, p);
    }
    p.total++;
    if (t.is_fraud) {
      p.fraud++;
      p.fraudAmount += t.amount;
    }
  }
  const cities = [...cityMap.values()]
    .map((p) => ({ ...p, fraudRate: p.total ? p.fraud / p.total : 0 }))
    .sort((a, b) => b.fraudRate - a.fraudRate);

  // ── Merchant fraud ───────────────────────────────────────────────────
  const merchMap = new Map<string, MerchantFraud>();
  for (const t of transactions) {
    let p = merchMap.get(t.merchant);
    if (!p) {
      p = { merchant: t.merchant, total: 0, fraud: 0, fraudAmount: 0, fraudRate: 0, totalAmount: 0 };
      merchMap.set(t.merchant, p);
    }
    p.total++;
    p.totalAmount += t.amount;
    if (t.is_fraud) {
      p.fraud++;
      p.fraudAmount += t.amount;
    }
  }
  const merchants = [...merchMap.values()]
    .map((p) => ({ ...p, fraudRate: p.total ? p.fraud / p.total : 0 }))
    .sort((a, b) => b.fraudRate - a.fraudRate);

  // ── Customer risk scoring ────────────────────────────────────────────
  // For each customer compute fraudCount, fraudAmount, total, then normalize.
  const custMap = new Map<number, CustomerRisk>();
  const custLookup = new Map<number, { name: string; city: string }>();
  for (const c of customers) {
    custLookup.set(c.customer_id, { name: c.customer_name, city: c.home_city });
  }
  for (const t of transactions) {
    let p = custMap.get(t.customer_id);
    if (!p) {
      const meta = custLookup.get(t.customer_id);
      p = {
        customer_id: t.customer_id,
        customer_name: meta?.name ?? `Customer ${t.customer_id}`,
        home_city: meta?.city ?? "Unknown",
        total: 0,
        fraudCount: 0,
        fraudAmount: 0,
        totalAmount: 0,
        riskScore: 0,
        riskLevel: "Low",
      };
      custMap.set(t.customer_id, p);
    }
    p.total++;
    p.totalAmount += t.amount;
    if (t.is_fraud) {
      p.fraudCount++;
      p.fraudAmount += t.amount;
    }
  }
  const customerArr = [...custMap.values()];
  // Normalize each component to 0–100
  const maxFraudCount = Math.max(1, ...customerArr.map((c) => c.fraudCount));
  const maxFraudAmount = Math.max(1, ...customerArr.map((c) => c.fraudAmount));
  const maxTxnFreq = Math.max(1, ...customerArr.map((c) => c.total));
  for (const c of customerArr) {
    const fc = (c.fraudCount / maxFraudCount) * 100;
    const fa = (c.fraudAmount / maxFraudAmount) * 100;
    const tf = (c.total / maxTxnFreq) * 100;
    c.riskScore = Math.round(0.5 * fc + 0.3 * fa + 0.2 * tf);
    c.riskLevel = classifyRisk(c.riskScore);
  }

  let highRisk = 0,
    medRisk = 0,
    lowRisk = 0;
  let highAmt = 0,
    medAmt = 0,
    lowAmt = 0;
  for (const c of customerArr) {
    if (c.riskLevel === "High") {
      highRisk++;
      highAmt += c.fraudAmount;
    } else if (c.riskLevel === "Medium") {
      medRisk++;
      medAmt += c.fraudAmount;
    } else {
      lowRisk++;
      lowAmt += c.fraudAmount;
    }
  }
  const topRiskCustomers = [...customerArr]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 200);

  // ── Transaction type fraud ───────────────────────────────────────────
  const typeMap = new Map<string, TypeFraud>();
  for (const t of transactions) {
    let p = typeMap.get(t.transaction_type);
    if (!p) {
      p = { type: t.transaction_type, total: 0, fraud: 0, fraudRate: 0 };
      typeMap.set(t.transaction_type, p);
    }
    p.total++;
    if (t.is_fraud) p.fraud++;
  }
  const txnTypes = [...typeMap.values()]
    .map((p) => ({ ...p, fraudRate: p.total ? p.fraud / p.total : 0 }))
    .sort((a, b) => b.total - a.total);

  // ── Heatmap (day × hour) ─────────────────────────────────────────────
  const heatmap: HeatmapCell[] = [];
  const grid: number[][][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => [0, 0]),
  );
  for (const t of transactions) {
    const cell = grid[t.day_of_week][t.hour];
    cell[0]++;
    if (t.is_fraud) cell[1]++;
  }
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      heatmap.push({ day: d, hour: h, total: grid[d][h][0], fraud: grid[d][h][1] });
    }
  }

  // ── Amount categories ────────────────────────────────────────────────
  const catMap = new Map<string, { category: string; total: number; fraud: number; fraudAmount: number }>();
  for (const t of transactions) {
    let p = catMap.get(t.amount_category);
    if (!p) {
      p = { category: t.amount_category, total: 0, fraud: 0, fraudAmount: 0 };
      catMap.set(t.amount_category, p);
    }
    p.total++;
    if (t.is_fraud) {
      p.fraud++;
      p.fraudAmount += t.amount;
    }
  }
  const amountCategories = ["Small", "Medium", "Large"]
    .map((name) => catMap.get(name) ?? { category: name, total: 0, fraud: 0, fraudAmount: 0 });

  // ── Weekend vs weekday ───────────────────────────────────────────────
  const we = { total: 0, fraud: 0 };
  const wd = { total: 0, fraud: 0 };
  for (const t of transactions) {
    const target = t.weekend_flag ? we : wd;
    target.total++;
    if (t.is_fraud) target.fraud++;
  }

  const kpi: KpiSummary = {
    totalTransactions,
    fraudTransactions,
    fraudPercentage: fraudTransactions / totalTransactions,
    totalCustomers: customers.length,
    totalMerchants: merchMap.size,
    averageTransactionValue: totalAmount / totalTransactions,
    totalFraudAmount,
    totalAmount,
    highRiskCustomers: highRisk,
    mediumRiskCustomers: medRisk,
    lowRiskCustomers: lowRisk,
  };

  bundle = {
    kpi,
    monthly,
    daily,
    hourly,
    cities,
    merchants,
    topRiskCustomers,
    txnTypes,
    heatmap,
    amountCategories,
    riskBuckets: [
      { level: "High", count: highRisk, fraudAmount: highAmt },
      { level: "Medium", count: medRisk, fraudAmount: medAmt },
      { level: "Low", count: lowRisk, fraudAmount: lowAmt },
    ],
    weekendVsWeekday: { weekend: we, weekday: wd },
  };
  return bundle;
}

// Lookup helper for customer detail / drill-throughs
export function getTransactionsForCustomer(customerId: number): Transaction[] {
  const { transactions } = loadAll();
  return transactions.filter((t) => t.customer_id === customerId);
}

export function getTransactionsForMerchant(merchant: string): Transaction[] {
  const { transactions } = loadAll();
  return transactions.filter((t) => t.merchant === merchant);
}
