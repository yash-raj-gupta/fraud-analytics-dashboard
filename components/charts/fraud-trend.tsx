"use client";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MonthlyPoint } from "@/lib/analytics";
import { intFmt } from "@/lib/utils";

export function FraudTrendChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer>
      <ComposedChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => intFmt.format(v)} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
        />
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
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="total" name="Total" fill="#1f6feb" opacity={0.25} />
        <Bar yAxisId="left" dataKey="fraud" name="Fraud" fill="#dc2626" />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="fraudRate"
          name="Fraud Rate"
          stroke="#d97706"
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
