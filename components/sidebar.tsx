"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Store,
  Receipt,
  ShieldCheck,
  LogOut,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { logout } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/fraud", label: "Fraud Analytics", icon: AlertTriangle },
  { href: "/customers", label: "Customer Risk", icon: Users },
  { href: "/merchants", label: "Merchant Intel", icon: Store },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/methodology", label: "Methodology", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <aside className="w-60 shrink-0 hidden md:flex md:flex-col border-r min-h-screen sticky top-0">
      <div className="p-5 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent text-white grid place-items-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">FraudAnalytics</p>
            <p className="text-[10px] uppercase tracking-wider muted">Banking Intelligence</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-accent text-white shadow-card"
                  : "muted hover:bg-[var(--bg)] hover:text-[var(--text)]",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t space-y-2">
        <ThemeToggle />
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm muted hover:text-danger transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileTopbar() {
  const pathname = usePathname();
  return (
    <div className="md:hidden border-b sticky top-0 bg-[var(--surface)] z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent text-white grid place-items-center">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm font-semibold">FraudAnalytics</p>
        </Link>
        <ThemeToggle />
      </div>
      <div className="overflow-x-auto px-4 pb-2 flex gap-1.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap",
                active ? "bg-accent text-white" : "surface muted",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
