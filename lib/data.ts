// Server-side data layer.
// Loads transactions.csv once into memory, computes derived columns,
// and exposes typed accessors used by API routes and server components.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type TxnType = "UPI" | "Online" | "POS" | "ATM";
export type RiskLevel = "High" | "Medium" | "Low";
export type AmountCategory = "Small" | "Medium" | "Large";

export interface Transaction {
  transaction_id: number;
  customer_id: number;
  transaction_date: string; // "YYYY-MM-DD HH:mm:ss"
  ts: number; // epoch ms
  amount: number;
  merchant: string;
  city: string;
  transaction_type: TxnType;
  is_fraud: 0 | 1;
  // derived
  hour: number;
  day_of_week: number;
  weekend_flag: 0 | 1;
  month: string; // "YYYY-MM"
  amount_category: AmountCategory;
}

export interface Customer {
  customer_id: number;
  customer_name: string;
  home_city: string;
}

export interface Merchant {
  merchant_id: number;
  merchant_name: string;
  category: string;
}

// ── CSV parser (handles quoted fields with embedded commas) ──────────────
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (ch === "\r") {
      // skip
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function amountCategory(a: number): AmountCategory {
  if (a < 1000) return "Small";
  if (a < 10000) return "Medium";
  return "Large";
}

let cache: {
  transactions: Transaction[];
  customers: Customer[];
  merchants: Merchant[];
} | null = null;

export function loadAll() {
  if (cache) return cache;
  const datasetDir = join(process.cwd(), "dataset");

  const txnRaw = parseCsv(readFileSync(join(datasetDir, "transactions.csv"), "utf8"));
  const txnHeader = txnRaw[0];
  const idxOf = (name: string) => txnHeader.indexOf(name);
  const iId = idxOf("transaction_id");
  const iCust = idxOf("customer_id");
  const iDate = idxOf("transaction_date");
  const iAmt = idxOf("amount");
  const iMerch = idxOf("merchant");
  const iCity = idxOf("city");
  const iType = idxOf("transaction_type");
  const iFraud = idxOf("is_fraud");

  const transactions: Transaction[] = [];
  for (let r = 1; r < txnRaw.length; r++) {
    const row = txnRaw[r];
    if (!row || row.length < 8 || !row[iId]) continue;
    const dateStr = row[iDate];
    const ts = Date.parse(dateStr.replace(" ", "T") + "Z");
    const d = new Date(ts);
    const hour = d.getUTCHours();
    const dow = d.getUTCDay();
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const amount = Number(row[iAmt]);
    transactions.push({
      transaction_id: Number(row[iId]),
      customer_id: Number(row[iCust]),
      transaction_date: dateStr,
      ts,
      amount,
      merchant: row[iMerch],
      city: row[iCity],
      transaction_type: row[iType] as TxnType,
      is_fraud: Number(row[iFraud]) === 1 ? 1 : 0,
      hour,
      day_of_week: dow,
      weekend_flag: dow === 0 || dow === 6 ? 1 : 0,
      month,
      amount_category: amountCategory(amount),
    });
  }

  const custRaw = parseCsv(readFileSync(join(datasetDir, "customers.csv"), "utf8"));
  const customers: Customer[] = custRaw.slice(1).filter((r) => r[0]).map((r) => ({
    customer_id: Number(r[0]),
    customer_name: r[1],
    home_city: r[2],
  }));

  const merchRaw = parseCsv(readFileSync(join(datasetDir, "merchants.csv"), "utf8"));
  const merchants: Merchant[] = merchRaw.slice(1).filter((r) => r[0]).map((r) => ({
    merchant_id: Number(r[0]),
    merchant_name: r[1],
    category: r[2],
  }));

  cache = { transactions, customers, merchants };
  return cache;
}
