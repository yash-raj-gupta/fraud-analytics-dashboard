"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChartSection } from "@/components/charts/section";
import { RiskPie } from "@/components/charts/risk-pie";
import { Search, ChevronRight } from "lucide-react";
import { inrCompact, intFmt, pct } from "@/lib/utils";
import type { CustomerRisk } from "@/lib/analytics";

interface ApiResponse {
  customers: CustomerRisk[];
  riskBuckets: { level: string; count: number; fraudAmount: number }[];
}

export default function CustomersPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (level) params.set("level", level);
    if (q) params.set("q", q);
    params.set("limit", "200");
    fetch(`/api/customers?${params}`)
      .then((r) => r.json())
      .then(setData);
  }, [level, q]);

  const totalRisky = useMemo(() => {
    if (!data) return 0;
    return data.riskBuckets.find((b) => b.level === "High")?.count ?? 0;
  }, [data]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider muted">Customer Risk</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Risk Segmentation</h1>
        <p className="text-sm muted mt-1">
          Score = 0.5 × fraud count + 0.3 × fraud amount + 0.2 × txn frequency · normalized 0–100.
        </p>
      </header>

      <section className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        <ChartSection title="Risk distribution" subtitle="Customers by computed risk level" height={300}>
          {data ? <RiskPie data={data.riskBuckets} /> : <Loading />}
        </ChartSection>
        <div className="xl:col-span-2 grid gap-4 grid-cols-2 md:grid-cols-3">
          {data?.riskBuckets.map((b) => {
            const tone =
              b.level === "High"
                ? "border-l-danger text-danger"
                : b.level === "Medium"
                  ? "border-l-warning text-warning"
                  : "border-l-success text-success";
            return (
              <button
                key={b.level}
                onClick={() => setLevel(level === b.level ? null : b.level)}
                className={`surface p-5 text-left border-l-4 transition ${tone} ${
                  level === b.level ? "ring-2 ring-accent" : ""
                }`}
              >
                <p className="text-xs uppercase tracking-wider muted">{b.level} Risk</p>
                <p className="text-3xl font-semibold tabular-nums mt-1">{intFmt.format(b.count)}</p>
                <p className="text-xs muted mt-2">
                  {inrCompact.format(b.fraudAmount)} · click to filter
                </p>
              </button>
            );
          })}
          <div className="surface p-5 col-span-2 md:col-span-3">
            <p className="text-xs uppercase tracking-wider muted">Concentration</p>
            <p className="text-sm mt-1">
              <span className="text-danger font-semibold tabular-nums">
                {intFmt.format(totalRisky)}
              </span>{" "}
              high-risk customers (top decile) — these accounts warrant manual review queue placement and elevated transaction
              authentication.
            </p>
          </div>
        </div>
      </section>

      <section className="surface">
        <header className="p-4 md:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold tracking-tight">Customer ranking</h3>
            <p className="text-xs muted">
              Top 200 by risk score{level ? ` · filtered to ${level} risk` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 surface px-3 py-2 w-full md:w-72">
            <Search className="w-4 h-4 muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search ID, name, city…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide muted bg-[var(--bg)]">
                <th className="px-4 py-2 font-medium">Rank</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">City</th>
                <th className="px-4 py-2 font-medium text-right">Total Txns</th>
                <th className="px-4 py-2 font-medium text-right">Fraud</th>
                <th className="px-4 py-2 font-medium text-right">Fraud Amount</th>
                <th className="px-4 py-2 font-medium text-right">Score</th>
                <th className="px-4 py-2 font-medium">Level</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.customers.map((c, i) => (
                <tr key={c.customer_id} className="hover:bg-[var(--bg)]">
                  <td className="px-4 py-2 muted tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">
                    {c.customer_name}
                    <div className="text-[11px] muted">#{c.customer_id}</div>
                  </td>
                  <td className="px-4 py-2 muted">{c.home_city}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{intFmt.format(c.total)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-danger">{intFmt.format(c.fraudCount)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{inrCompact.format(c.fraudAmount)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold">{c.riskScore}</td>
                  <td className="px-4 py-2">
                    <RiskPill level={c.riskLevel} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/transactions?customer_id=${c.customer_id}`}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      Drill <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!data && (
                <tr>
                  <td colSpan={9} className="p-8 text-center muted text-sm">
                    Loading…
                  </td>
                </tr>
              )}
              {data && data.customers.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center muted text-sm">
                    No customers match this filter.
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

function RiskPill({ level }: { level: string }) {
  const cls =
    level === "High"
      ? "bg-danger/10 text-danger"
      : level === "Medium"
        ? "bg-warning/10 text-warning"
        : "bg-success/10 text-success";
  return <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>{level}</span>;
}

function Loading() {
  return <div className="grid place-items-center h-full muted text-sm">Loading…</div>;
}
