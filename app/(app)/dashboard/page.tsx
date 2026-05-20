import { getAnalytics } from "@/lib/analytics";
import { KpiCard } from "@/components/kpi-card";
import { ChartSection } from "@/components/charts/section";
import { FraudTrendChart } from "@/components/charts/fraud-trend";
import { DailyVolumeChart } from "@/components/charts/daily-volume";
import { TxnTypeChart } from "@/components/charts/txn-type";
import { RegionFraudChart } from "@/components/charts/region-fraud";
import {
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Users,
  Wallet,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { inr, inrCompact, intFmt, pct } from "@/lib/utils";

export const dynamic = "force-static";

export default function DashboardPage() {
  const a = getAnalytics();
  const k = a.kpi;
  const lastMonth = a.monthly[a.monthly.length - 1];
  const prevMonth = a.monthly[a.monthly.length - 2];
  const momDelta = prevMonth ? (lastMonth.fraud - prevMonth.fraud) / Math.max(1, prevMonth.fraud) : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider muted">Executive Overview</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Fraud Operations Console</h1>
          <p className="text-sm muted mt-1">
            12-month rolling view across {intFmt.format(k.totalTransactions)} transactions ·{" "}
            {intFmt.format(k.totalCustomers)} customers · {intFmt.format(k.totalMerchants)} merchants.
          </p>
        </div>
        <div className="text-xs muted">
          Last refreshed {new Date().toUTCString().replace("GMT", "UTC")}
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Total Transactions"
          value={intFmt.format(k.totalTransactions)}
          icon={CreditCard}
          accent="default"
          hint={`${inrCompact.format(k.totalAmount)} processed`}
        />
        <KpiCard
          label="Fraud Transactions"
          value={intFmt.format(k.fraudTransactions)}
          icon={AlertTriangle}
          accent="danger"
          delta={`${momDelta >= 0 ? "+" : ""}${(momDelta * 100).toFixed(1)}% MoM`}
          deltaTone={momDelta >= 0 ? "down" : "up"}
        />
        <KpiCard
          label="Fraud %"
          value={pct(k.fraudPercentage)}
          icon={TrendingUp}
          accent="warning"
          hint="Industry avg ~0.6–1.5%"
        />
        <KpiCard
          label="Total Customers"
          value={intFmt.format(k.totalCustomers)}
          icon={Users}
          accent="default"
          hint={`${intFmt.format(k.highRiskCustomers)} flagged high-risk`}
        />
        <KpiCard
          label="Avg. Transaction Value"
          value={inr.format(Math.round(k.averageTransactionValue))}
          icon={Wallet}
          accent="success"
        />
      </section>

      <section className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        <ChartSection
          title="Monthly fraud trend"
          subtitle="Transactions volume × fraud incidence rate"
          className="xl:col-span-2"
          height={320}
        >
          <FraudTrendChart data={a.monthly} />
        </ChartSection>
        <div className="grid gap-4">
          <div className="surface p-5 relative overflow-hidden">
            <div className="absolute inset-0 kpi-sheen pointer-events-none" />
            <div className="relative">
              <p className="text-xs uppercase tracking-wider muted">Total Fraud Amount</p>
              <p className="text-3xl font-semibold tabular-nums mt-1 text-danger">
                {inrCompact.format(k.totalFraudAmount)}
              </p>
              <p className="text-xs muted mt-1">
                {pct(k.totalFraudAmount / k.totalAmount, 2)} of money flow
              </p>
            </div>
            <div className="relative grid grid-cols-3 gap-2 mt-5">
              <Stat label="High risk" value={intFmt.format(k.highRiskCustomers)} tone="danger" />
              <Stat label="Medium" value={intFmt.format(k.mediumRiskCustomers)} tone="warning" />
              <Stat label="Low" value={intFmt.format(k.lowRiskCustomers)} tone="success" />
            </div>
          </div>
          <div className="surface p-5">
            <p className="text-xs uppercase tracking-wider muted">Weekend vs. Weekday</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-xl font-semibold tabular-nums">
                  {pct(a.weekendVsWeekday.weekend.fraud / a.weekendVsWeekday.weekend.total, 2)}
                </p>
                <p className="text-xs muted">Weekend fraud rate</p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">
                  {pct(a.weekendVsWeekday.weekday.fraud / a.weekendVsWeekday.weekday.total, 2)}
                </p>
                <p className="text-xs muted">Weekday fraud rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <ChartSection
          title="Daily transaction volume"
          subtitle="Total + fraud events, last 90 days"
          height={300}
        >
          <DailyVolumeChart data={a.daily} />
        </ChartSection>
        <ChartSection title="Fraud vs. genuine by channel" subtitle="Counts per transaction type" height={300}>
          <TxnTypeChart data={a.txnTypes} />
        </ChartSection>
      </section>

      <section className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <ChartSection title="Region-wise fraud rate" subtitle="Top cities by fraud incidence" height={320}>
          <RegionFraudChart data={a.cities} />
        </ChartSection>
        <div className="surface p-5">
          <header className="mb-3">
            <h3 className="font-semibold tracking-tight">Top suspicious merchants</h3>
            <p className="text-xs muted">Sorted by fraud rate · click for drill-through</p>
          </header>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide muted">
                  <th className="px-2 py-2 font-medium">Merchant</th>
                  <th className="px-2 py-2 font-medium text-right">Total</th>
                  <th className="px-2 py-2 font-medium text-right">Fraud</th>
                  <th className="px-2 py-2 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {a.merchants.slice(0, 8).map((m) => (
                  <tr key={m.merchant} className="hover:bg-[var(--bg)] transition">
                    <td className="px-2 py-2 font-medium">{m.merchant}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{intFmt.format(m.total)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-danger">{intFmt.format(m.fraud)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      <span className="px-1.5 py-0.5 rounded-md text-xs font-medium bg-danger/10 text-danger">
                        {pct(m.fraudRate, 1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "danger" | "warning" | "success" }) {
  const cls = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-success";
  return (
    <div>
      <p className={`text-base font-semibold tabular-nums ${cls}`}>{value}</p>
      <p className="text-[10px] muted uppercase tracking-wider">{label}</p>
    </div>
  );
}
