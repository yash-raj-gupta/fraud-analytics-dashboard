"use client";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
  Cell,
} from "recharts";
import type { Transaction } from "@/lib/data";
import { inrCompact, formatHour } from "@/lib/utils";

export function AnomalyScatter({ sample }: { sample: Transaction[] }) {
  return (
    <ResponsiveContainer>
      <ScatterChart margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          name="Hour"
          type="number"
          domain={[0, 23]}
          tickCount={12}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatHour(v)}
        />
        <YAxis
          dataKey="amount"
          name="Amount"
          type="number"
          scale="log"
          domain={[20, 500000]}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => inrCompact.format(v)}
        />
        <ZAxis range={[20, 80]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
          }}
          formatter={(v: number, name: string) => {
            if (name === "Amount") return inrCompact.format(v);
            if (name === "Hour") return formatHour(v);
            return v;
          }}
        />
        <Scatter data={sample.filter((t) => !t.is_fraud)} fill="#1f6feb" fillOpacity={0.25} name="Genuine" />
        <Scatter data={sample.filter((t) => t.is_fraud)} fill="#dc2626" name="Fraud">
          {sample
            .filter((t) => t.is_fraud)
            .map((_, i) => (
              <Cell key={i} fill="#dc2626" />
            ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
