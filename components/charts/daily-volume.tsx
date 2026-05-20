"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { DailyPoint } from "@/lib/analytics";
import { intFmt } from "@/lib/utils";

export function DailyVolumeChart({ data }: { data: DailyPoint[] }) {
  // Show last 90 days
  const slice = data.slice(-90);
  return (
    <ResponsiveContainer>
      <AreaChart data={slice} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="volume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f6feb" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#1f6feb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fraudVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(slice.length / 8)} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => intFmt.format(v)} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
          }}
          formatter={(v: number) => intFmt.format(v)}
        />
        <Area type="monotone" dataKey="total" name="Total" stroke="#1f6feb" fill="url(#volume)" strokeWidth={2} />
        <Area type="monotone" dataKey="fraud" name="Fraud" stroke="#dc2626" fill="url(#fraudVolume)" strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
