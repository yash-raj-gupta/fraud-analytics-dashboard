import { getAnalytics } from "@/lib/analytics";
import { loadAll } from "@/lib/data";
import { ChartSection } from "@/components/charts/section";
import { FraudHeatmap } from "@/components/charts/heatmap";
import { HourlyFraudChart } from "@/components/charts/hourly-fraud";
import { RegionFraudChart } from "@/components/charts/region-fraud";
import { AnomalyScatter } from "@/components/charts/anomaly-scatter";
import { intFmt, pct, formatHour, inrCompact } from "@/lib/utils";

export const dynamic = "force-static";

export default function FraudPage() {
  const a = getAnalytics();
  const { transactions } = loadAll();

  // Down-sample for the scatter (3000 random points keeps it readable)
  const stride = Math.max(1, Math.floor(transactions.length / 3000));
  const sample = transactions.filter((_, i) => i % stride === 0);

  // Find the worst hour
  const worstHour = [...a.hourly].sort((x, y) => y.fraudRate - x.fraudRate)[0];
  const worstCity = a.cities[0];
  const worstCat = [...a.amountCategories].sort((x, y) => y.fraudAmount - x.fraudAmount)[0];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider muted">Fraud Analytics</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Pattern Detection</h1>
        <p className="text-sm muted mt-1">
          Time, geography, channel, amount — every angle on the {intFmt.format(a.kpi.fraudTransactions)} fraud incidents.
        </p>
      </header>

      <section className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Insight
          tone="danger"
          headline={formatHour(worstHour.hour)}
          label="Peak fraud hour"
          detail={`${pct(worstHour.fraudRate, 2)} fraud rate · ${intFmt.format(worstHour.fraud)} incidents`}
        />
        <Insight
          tone="warning"
          headline={worstCity.city}
          label="Highest-risk region"
          detail={`${pct(worstCity.fraudRate, 2)} fraud rate · ${inrCompact.format(worstCity.fraudAmount)} lost`}
        />
        <Insight
          tone="default"
          headline={worstCat.category}
          label="Largest-loss bucket"
          detail={`${inrCompact.format(worstCat.fraudAmount)} across ${intFmt.format(worstCat.fraud)} fraud txns`}
        />
      </section>

      <ChartSection
        title="Fraud heatmap — day × hour"
        subtitle="Darker = more fraud activity. Use to spot recurring time-windows of risk."
        height={260}
      >
        <FraudHeatmap data={a.heatmap} />
      </ChartSection>

      <section className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <ChartSection
          title="Hour-wise fraud activity"
          subtitle="Counts (bars) and fraud rate (line) by hour-of-day, UTC"
          height={300}
        >
          <HourlyFraudChart data={a.hourly} />
        </ChartSection>
        <ChartSection title="Region-wise fraud rate" subtitle="Cities ranked by fraud incidence" height={300}>
          <RegionFraudChart data={a.cities} />
        </ChartSection>
      </section>

      <ChartSection
        title="Transaction anomaly scatter"
        subtitle="Hour-of-day vs amount (log scale). Red = fraud — clusters in early hours and on the high-amount tail."
        height={380}
      >
        <AnomalyScatter sample={sample} />
      </ChartSection>

      <ChartSection title="Fraud category distribution" subtitle="By transaction amount bucket" height={260}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide muted">
              <th className="py-2 font-medium">Bucket</th>
              <th className="py-2 font-medium text-right">Total Txns</th>
              <th className="py-2 font-medium text-right">Fraud Txns</th>
              <th className="py-2 font-medium text-right">Fraud Rate</th>
              <th className="py-2 font-medium text-right">Fraud Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {a.amountCategories.map((c) => (
              <tr key={c.category}>
                <td className="py-2 font-medium">{c.category}</td>
                <td className="py-2 text-right tabular-nums">{intFmt.format(c.total)}</td>
                <td className="py-2 text-right tabular-nums text-danger">{intFmt.format(c.fraud)}</td>
                <td className="py-2 text-right tabular-nums">{pct(c.total ? c.fraud / c.total : 0, 2)}</td>
                <td className="py-2 text-right tabular-nums">{inrCompact.format(c.fraudAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartSection>
    </div>
  );
}

function Insight({
  tone,
  label,
  headline,
  detail,
}: {
  tone: "default" | "danger" | "warning";
  label: string;
  headline: string;
  detail: string;
}) {
  const tones = {
    default: "border-l-accent",
    danger: "border-l-danger",
    warning: "border-l-warning",
  };
  return (
    <div className={`surface p-5 border-l-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wider muted">{label}</p>
      <p className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">{headline}</p>
      <p className="text-xs muted mt-1">{detail}</p>
    </div>
  );
}
