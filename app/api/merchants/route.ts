import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const a = getAnalytics();
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get("limit") ?? 30), 200);
  const sortBy = sp.get("sort") ?? "fraudRate"; // fraudRate | fraud | totalAmount
  const search = sp.get("q")?.toLowerCase().trim();

  let rows = [...a.merchants];
  if (search) rows = rows.filter((m) => m.merchant.toLowerCase().includes(search));
  if (sortBy === "fraud") rows.sort((a, b) => b.fraud - a.fraud);
  else if (sortBy === "totalAmount") rows.sort((a, b) => b.totalAmount - a.totalAmount);
  else rows.sort((a, b) => b.fraudRate - a.fraudRate);

  return NextResponse.json({ merchants: rows.slice(0, limit) });
}
