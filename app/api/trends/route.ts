import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";

export const dynamic = "force-static";

export async function GET() {
  const a = getAnalytics();
  return NextResponse.json({
    monthly: a.monthly,
    daily: a.daily,
    hourly: a.hourly,
    heatmap: a.heatmap,
  });
}
