"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { CityFraud } from "@/lib/analytics";

export function RegionFraudChart({ data }: { data: CityFraud[] }) {
  const sorted = [...data].sort((a, b) => b.fraudRate - a.fraudRate);
  return (
    <ResponsiveContainer>
      <BarChart layout="vertical" data={sorted} margin={{ top: 10, right: 14, left: 70, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
        <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} width={70} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
          }}
          formatter={(v: number) => `${(v * 100).toFixed(2)}%`}
        />
        <Bar dataKey="fraudRate" radius={[0, 4, 4, 0]}>
          {sorted.map((d, i) => (
            <Cell key={i} fill={i < 3 ? "#dc2626" : i < 6 ? "#d97706" : "#1f6feb"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
