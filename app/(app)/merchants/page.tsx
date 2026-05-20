"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChartSection } from "@/components/charts/section";
import { MerchantBar } from "@/components/charts/merchant-bar";
import { Search, ChevronRight, AlertTriangle } from "lucide-react";
import { inrCompact, intFmt, pct } from "@/lib/utils";
import type { MerchantFraud } from "@/lib/analytics";

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantFraud[] | null>(null);
  const [sort, setSort] = useState<"fraudRate" | "fraud" | "totalAmount">("fraudRate");
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ sort, limit: "60" });
    if (q) params.set("q", q);
    fetch(`/api/merchants?${params}`)
      .then((r) => r.json())
      .then((d) => setMerchants(d.merchants));
  }, [sort, q]);

  const top10 = merchants?.slice(0, 10) ?? [];
  const flagged = merchants?.filter((m) => m.fraudRate > 0.05) ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider muted">Merchant Intelligence</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Merchant Risk Surveillance</h1>
        <p className="text-sm muted mt-1">
          Identify compromised merchants — those with anomalous fraud rates, large fraud volume, or both.
        </p>
      </header>

      <section className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="surface p-5 border-l-4 border-l-danger">
          <p className="text-xs uppercase tracking-wider muted">Flagged merchants</p>
          <p className="text-3xl font-semibold tabular-nums mt-1 text-danger">
            {intFmt.format(flagged.length)}
          </p>
          <p className="text-xs muted mt-1">Fraud rate &gt; 5%</p>
        </div>
        <div className="surface p-5 border-l-4 border-l-warning">
          <p className="text-xs uppercase tracking-wider muted">Aggregate fraud loss</p>
          <p className="text-3xl font-semibold tabular-nums mt-1 text-warning">
            {merchants ? inrCompact.format(merchants.reduce((s, m) => s + m.fraudAmount, 0)) : "—"}
          </p>
          <p className="text-xs muted mt-1">Across visible merchants</p>
        </div>
        <div className="surface p-5 border-l-4 border-l-accent">
          <p className="text-xs uppercase tracking-wider muted">Worst single merchant</p>
          <p className="text-2xl font-semibold tracking-tight mt-1 truncate">
            {top10[0]?.merchant ?? "—"}
          </p>
          <p className="text-xs muted mt-1">
            {top10[0] ? `${pct(top10[0].fraudRate, 1)} fraud · ${inrCompact.format(top10[0].fraudAmount)}` : ""}
          </p>
        </div>
      </section>

      <ChartSection
        title="Top 10 by fraud rate"
        subtitle="Compromised or high-risk channels"
        height={400}
        right={
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="surface px-3 py-1.5 text-xs"
          >
            <option value="fraudRate">Sort: Fraud rate</option>
            <option value="fraud">Sort: Fraud count</option>
            <option value="totalAmount">Sort: Total volume</option>
          </select>
        }
      >
        {merchants ? <MerchantBar data={top10} /> : <div className="grid place-items-center h-full muted">Loading…</div>}
      </ChartSection>

      <section className="surface">
        <header className="p-4 md:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold tracking-tight">All merchants</h3>
            <p className="text-xs muted">Click any row to see its transactions</p>
          </div>
          <div className="flex items-center gap-2 surface px-3 py-2 w-full md:w-72">
            <Search className="w-4 h-4 muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search merchant…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide muted bg-[var(--bg)]">
                <th className="px-4 py-2 font-medium">Merchant</th>
                <th className="px-4 py-2 font-medium text-right">Total Txns</th>
                <th className="px-4 py-2 font-medium text-right">Fraud Txns</th>
                <th className="px-4 py-2 font-medium text-right">Fraud Rate</th>
                <th className="px-4 py-2 font-medium text-right">Fraud Amount</th>
                <th className="px-4 py-2 font-medium text-right">Total Volume</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {merchants?.map((m) => (
                <tr key={m.merchant} className="hover:bg-[var(--bg)]">
                  <td className="px-4 py-2 font-medium flex items-center gap-2">
                    {m.fraudRate > 0.1 && <AlertTriangle className="w-3.5 h-3.5 text-danger" />}
                    {m.merchant}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{intFmt.format(m.total)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-danger">{intFmt.format(m.fraud)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${
                        m.fraudRate > 0.1
                          ? "bg-danger/10 text-danger"
                          : m.fraudRate > 0.05
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                      }`}
                    >
                      {pct(m.fraudRate, 2)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{inrCompact.format(m.fraudAmount)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{inrCompact.format(m.totalAmount)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/transactions?merchant=${encodeURIComponent(m.merchant)}`}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      Drill <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!merchants && (
                <tr>
                  <td colSpan={7} className="p-8 text-center muted text-sm">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
