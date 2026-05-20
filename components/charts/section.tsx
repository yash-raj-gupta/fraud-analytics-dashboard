import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ChartSection({
  title,
  subtitle,
  right,
  children,
  className,
  height = 320,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  height?: number;
}) {
  return (
    <section className={cn("surface p-5 md:p-6", className)}>
      <header className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs muted mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div style={{ width: "100%", height }}>{children}</div>
    </section>
  );
}
