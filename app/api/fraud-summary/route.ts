import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";

export const dynamic = "force-static";

export async function GET() {
  const a = getAnalytics();
  return NextResponse.json({
    kpi: a.kpi,
    txnTypes: a.txnTypes,
    amountCategories: a.amountCategories,
    weekendVsWeekday: a.weekendVsWeekday,
    riskBuckets: a.riskBuckets,
  });
}
