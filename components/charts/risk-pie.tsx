"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { intFmt } from "@/lib/utils";

const COLORS: Record<string, string> = {
  High: "#dc2626",
  Medium: "#d97706",
  Low: "#059669",
};

export function RiskPie({ data }: { data: { level: string; count: number; fraudAmount: number }[] }) {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="level"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          minAngle={8}
          stroke="var(--surface)"
          strokeWidth={2}
        >
          {data.map((d) => (
            <Cell key={d.level} fill={COLORS[d.level]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
            color: "var(--text)",
          }}
          itemStyle={{ color: "var(--text)" }}
          labelStyle={{ color: "var(--text)" }}
          formatter={(v: number) => intFmt.format(v)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
