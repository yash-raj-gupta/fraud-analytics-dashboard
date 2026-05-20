import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  accent?: "default" | "danger" | "success" | "warning";
  hint?: string;
}

export function KpiCard({ label, value, delta, deltaTone = "neutral", icon: Icon, accent = "default", hint }: Props) {
  const accentMap = {
    default: "text-accent border-accent/30",
    danger: "text-danger border-danger/30",
    success: "text-success border-success/30",
    warning: "text-warning border-warning/30",
  };
  const toneMap = {
    up: "text-success",
    down: "text-danger",
    neutral: "muted",
  };
  return (
    <div className="surface p-5 relative overflow-hidden">
      <div className="absolute inset-0 kpi-sheen pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide muted font-medium">{label}</p>
          <p className="text-2xl md:text-3xl font-semibold tabular-nums">{value}</p>
          {delta && (
            <p className={cn("text-xs font-medium", toneMap[deltaTone])}>{delta}</p>
          )}
          {hint && <p className="text-xs muted">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center", accentMap[accent])}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>
    </div>
  );
}
