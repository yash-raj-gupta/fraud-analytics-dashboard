import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, getTransactionsForCustomer } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = Number(sp.get("customer_id"));
  if (!id) return NextResponse.json({ error: "customer_id required" }, { status: 400 });

  const a = getAnalytics();
  const cust = a.topRiskCustomers.find((c) => c.customer_id === id);
  if (!cust) return NextResponse.json({ error: "not found" }, { status: 404 });

  const txns = getTransactionsForCustomer(id).slice(0, 200);
  return NextResponse.json({ customer: cust, transactions: txns });
}
