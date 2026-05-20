"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { login, getSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("analyst@bank.example");
  const [password, setPassword] = useState("demo");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
  }, [router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    login(email);
    setTimeout(() => router.push("/dashboard"), 250);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 grid-bg">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-accent-700 to-ink-900 text-white">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="font-semibold tracking-tight">FraudAnalytics</p>
        </div>
        <div className="space-y-5 max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            Bank-grade fraud intelligence,
            <span className="block text-accent-200">in one operating picture.</span>
          </h1>
          <p className="text-sm text-white/70 leading-relaxed">
            Monitor 100K+ credit card transactions, segment customer risk, surface suspicious merchants,
            and drill from any KPI down to the single transaction that triggered it.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              ["100K+", "transactions"],
              ["3.5K", "customers"],
              ["90+", "merchants"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-xl font-semibold tabular-nums">{a}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">{b}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} FraudAnalytics — A portfolio analytics platform
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6 surface-elevated p-8 relative overflow-hidden">
          <div className="absolute inset-0 kpi-sheen pointer-events-none" />
          <div className="relative space-y-1">
            <p className="text-xs uppercase tracking-wider muted">Sign in</p>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm muted">
              Use any email + password — this is a demo dashboard.
            </p>
          </div>
          <div className="relative space-y-3">
            <label className="block">
              <span className="text-xs muted">Email</span>
              <div className="mt-1 flex items-center gap-2 surface px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
                <Mail className="w-4 h-4 muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  autoComplete="email"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs muted">Password</span>
              <div className="mt-1 flex items-center gap-2 surface px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
                <Lock className="w-4 h-4 muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  autoComplete="current-password"
                />
              </div>
            </label>
            <label className="flex items-center gap-2 text-xs muted select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-accent"
              />
              Keep me signed in
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="relative w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-600 disabled:opacity-60 transition"
          >
            {submitting ? "Signing in…" : "Sign in"}
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="relative text-[11px] muted text-center pt-1">
            Demo only — no real authentication. Tier-1 SSO/MFA goes here in production.
          </p>
        </form>
      </div>
    </div>
  );
}
