import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const a = getAnalytics();
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get("limit") ?? 200), 1000);
  const level = sp.get("level"); // High | Medium | Low | undefined
  const search = sp.get("q")?.toLowerCase().trim();

  let rows = a.topRiskCustomers;
  if (level) rows = rows.filter((c) => c.riskLevel === level);
  if (search) {
    rows = rows.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(search) ||
        String(c.customer_id).includes(search) ||
        c.home_city.toLowerCase().includes(search),
    );
  }
  return NextResponse.json({
    customers: rows.slice(0, limit),
    riskBuckets: a.riskBuckets,
  });
}
