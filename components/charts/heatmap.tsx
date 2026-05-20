"use client";
import type { HeatmapCell } from "@/lib/analytics";
import { DOW, formatHour, intFmt } from "@/lib/utils";

export function FraudHeatmap({ data }: { data: HeatmapCell[] }) {
  // 7 rows × 24 cols
  const grid: HeatmapCell[][] = Array.from({ length: 7 }, () => Array(24).fill(null));
  let max = 0;
  for (const c of data) {
    grid[c.day][c.hour] = c;
    if (c.fraud > max) max = c.fraud;
  }
  const colorFor = (n: number) => {
    if (n === 0) return "rgba(31, 111, 235, 0.06)";
    const t = Math.min(1, n / max);
    // blue → red gradient via HSL hue 220 → 0
    const hue = 220 - 220 * t;
    return `hsl(${hue}, 75%, ${65 - 25 * t}%)`;
  };
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-[2px] mx-auto">
        <thead>
          <tr>
            <th></th>
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="text-[9px] muted font-normal tabular-nums w-6">
                {h % 3 === 0 ? formatHour(h) : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DOW.map((d, dayIdx) => (
            <tr key={d}>
              <td className="text-[10px] muted pr-2 font-medium">{d}</td>
              {Array.from({ length: 24 }, (_, h) => {
                const cell = grid[dayIdx][h];
                const n = cell?.fraud ?? 0;
                return (
                  <td
                    key={h}
                    title={`${d} ${formatHour(h)} — ${intFmt.format(n)} fraud / ${intFmt.format(cell?.total ?? 0)} total`}
                    style={{ background: colorFor(n) }}
                    className="w-6 h-6 rounded-[3px]"
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] muted">
        <span>Low</span>
        <div className="w-32 h-2 rounded-sm" style={{ background: "linear-gradient(to right, hsl(220,75%,65%), hsl(0,75%,40%))" }} />
        <span>High fraud</span>
      </div>
    </div>
  );
}
