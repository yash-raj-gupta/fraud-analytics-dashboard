"use client";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-[110px] h-9" />;
  const opts = [
    { v: "light", icon: Sun },
    { v: "dark", icon: Moon },
    { v: "system", icon: Monitor },
  ] as const;
  return (
    <div className="surface inline-flex p-1 gap-0.5">
      {opts.map(({ v, icon: Icon }) => (
        <button
          key={v}
          onClick={() => setTheme(v)}
          aria-label={`${v} theme`}
          className={cn(
            "px-2.5 py-1.5 rounded-md transition-colors",
            theme === v ? "bg-accent text-white" : "muted hover:text-[var(--text)]",
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
