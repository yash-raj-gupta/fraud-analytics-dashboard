"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from "recharts";
import type { TypeFraud } from "@/lib/analytics";
import { intFmt } from "@/lib/utils";

export function TxnTypeChart({ data }: { data: TypeFraud[] }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="type" tick={{ fontSize: 11 }} />
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
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="total" name="Total" fill="#1f6feb" opacity={0.3} radius={[6, 6, 0, 0]} />
        <Bar dataKey="fraud" name="Fraud" fill="#dc2626" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill="#dc2626" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
