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
import type { MerchantFraud } from "@/lib/analytics";

export function MerchantBar({ data }: { data: MerchantFraud[] }) {
  return (
    <ResponsiveContainer>
      <BarChart layout="vertical" data={data} margin={{ top: 10, right: 14, left: 130, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
        <YAxis type="category" dataKey="merchant" tick={{ fontSize: 10 }} width={130} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
          }}
          formatter={(v: number, name: string) => {
            if (name === "fraudRate") return `${(v * 100).toFixed(2)}%`;
            return v;
          }}
        />
        <Bar dataKey="fraudRate" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fraudRate > 0.1 ? "#dc2626" : d.fraudRate > 0.04 ? "#d97706" : "#1f6feb"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
