import { NextRequest, NextResponse } from "next/server";
import { loadAll } from "@/lib/data";

export async function GET(req: NextRequest) {
  const { transactions } = loadAll();
  const sp = req.nextUrl.searchParams;

  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(Math.max(10, Number(sp.get("pageSize") ?? 50)), 200);
  const fraudParam = sp.get("fraud"); // "1" | "0" | null
  const type = sp.get("type"); // UPI | Online | POS | ATM
  const city = sp.get("city");
  const merchant = sp.get("merchant");
  const customerId = sp.get("customer_id");
  const minAmt = Number(sp.get("minAmount") ?? 0);
  const maxAmt = sp.get("maxAmount") ? Number(sp.get("maxAmount")) : Number.POSITIVE_INFINITY;
  const from = sp.get("from");
  const to = sp.get("to");
  const sort = sp.get("sort") ?? "date_desc"; // date_desc | date_asc | amount_desc | amount_asc

  let rows = transactions;
  if (fraudParam === "1" || fraudParam === "0") {
    const f = Number(fraudParam) as 0 | 1;
    rows = rows.filter((t) => t.is_fraud === f);
  }
  if (type) rows = rows.filter((t) => t.transaction_type === type);
  if (city) rows = rows.filter((t) => t.city === city);
  if (merchant) rows = rows.filter((t) => t.merchant === merchant);
  if (customerId) rows = rows.filter((t) => String(t.customer_id) === customerId);
  if (minAmt > 0 || Number.isFinite(maxAmt)) {
    rows = rows.filter((t) => t.amount >= minAmt && t.amount <= maxAmt);
  }
  if (from) rows = rows.filter((t) => t.transaction_date >= from);
  if (to) rows = rows.filter((t) => t.transaction_date <= to);

  // Avoid mutating cached array
  rows = [...rows];
  if (sort === "date_desc") rows.sort((a, b) => b.ts - a.ts);
  else if (sort === "date_asc") rows.sort((a, b) => a.ts - b.ts);
  else if (sort === "amount_desc") rows.sort((a, b) => b.amount - a.amount);
  else if (sort === "amount_asc") rows.sort((a, b) => a.amount - b.amount);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const data = rows.slice(start, start + pageSize);
  return NextResponse.json({ data, total, page, pageSize });
}
