"use client";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { HourlyPoint } from "@/lib/analytics";
import { intFmt, formatHour } from "@/lib/utils";

export function HourlyFraudChart({ data }: { data: HourlyPoint[] }) {
  const formatted = data.map((d) => ({ ...d, label: formatHour(d.hour) }));
  return (
    <ResponsiveContainer>
      <ComposedChart data={formatted} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => intFmt.format(v)} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => {
            if (name === "Fraud Rate") return `${(value * 100).toFixed(2)}%`;
            return intFmt.format(value);
          }}
        />
        <Bar yAxisId="left" dataKey="fraud" name="Fraud Count" fill="#dc2626" />
        <Line yAxisId="right" type="monotone" dataKey="fraudRate" name="Fraud Rate" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
