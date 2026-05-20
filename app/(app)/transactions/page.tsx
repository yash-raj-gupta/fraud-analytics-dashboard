"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Download, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Transaction } from "@/lib/data";
import { inr, intFmt } from "@/lib/utils";

interface ApiResponse {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

const TYPES = ["UPI", "Online", "POS", "ATM"];
const SORTS = [
  { v: "date_desc", label: "Newest first" },
  { v: "date_asc", label: "Oldest first" },
  { v: "amount_desc", label: "Largest amount" },
  { v: "amount_asc", label: "Smallest amount" },
];

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="muted text-sm">Loading…</div>}>
      <TransactionsView />
    </Suspense>
  );
}

function TransactionsView() {
  const router = useRouter();
  const sp = useSearchParams();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [fraud, setFraud] = useState<string>(sp.get("fraud") ?? "");
  const [type, setType] = useState<string>(sp.get("type") ?? "");
  const [city, setCity] = useState<string>(sp.get("city") ?? "");
  const [merchant, setMerchant] = useState<string>(sp.get("merchant") ?? "");
  const [customerId, setCustomerId] = useState<string>(sp.get("customer_id") ?? "");
  const [minAmt, setMinAmt] = useState<string>(sp.get("minAmount") ?? "");
  const [maxAmt, setMaxAmt] = useState<string>(sp.get("maxAmount") ?? "");
  const [from, setFrom] = useState<string>(sp.get("from") ?? "");
  const [to, setTo] = useState<string>(sp.get("to") ?? "");
  const [sort, setSort] = useState<string>(sp.get("sort") ?? "date_desc");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (fraud) p.set("fraud", fraud);
    if (type) p.set("type", type);
    if (city) p.set("city", city);
    if (merchant) p.set("merchant", merchant);
    if (customerId) p.set("customer_id", customerId);
    if (minAmt) p.set("minAmount", minAmt);
    if (maxAmt) p.set("maxAmount", maxAmt);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (sort) p.set("sort", sort);
    return p.toString();
  }, [page, pageSize, fraud, type, city, merchant, customerId, minAmt, maxAmt, from, to, sort]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/transactions?${queryString}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [queryString]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const clearFilters = () => {
    setFraud("");
    setType("");
    setCity("");
    setMerchant("");
    setCustomerId("");
    setMinAmt("");
    setMaxAmt("");
    setFrom("");
    setTo("");
    setPage(1);
    router.replace("/transactions");
  };

  const exportCsv = () => {
    if (!data) return;
    const headers = ["transaction_id", "customer_id", "transaction_date", "amount", "merchant", "city", "transaction_type", "is_fraud"];
    const rows = data.data.map((t) =>
      [t.transaction_id, t.customer_id, t.transaction_date, t.amount, `"${t.merchant.replaceAll('"', '""')}"`, t.city, t.transaction_type, t.is_fraud].join(","),
    );
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider muted">Transactions</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Transaction Explorer</h1>
          <p className="text-sm muted mt-1">
            {data ? `${intFmt.format(data.total)} matching` : "Loading"} · drill, filter, and export.
          </p>
        </div>
        <button onClick={exportCsv} className="surface px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-[var(--bg)]">
          <Download className="w-4 h-4" /> Export page
        </button>
      </header>

      <section className="surface p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 muted" />
          <p className="text-xs uppercase tracking-wider muted">Filters</p>
          <button onClick={clearFilters} className="ml-auto text-xs muted hover:text-danger inline-flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all
          </button>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <FilterPicker label="Status">
            <select value={fraud} onChange={(e) => { setFraud(e.target.value); setPage(1); }} className="bg-transparent outline-none text-sm w-full">
              <option value="">All</option>
              <option value="1">Fraud only</option>
              <option value="0">Genuine only</option>
            </select>
          </FilterPicker>
          <FilterPicker label="Channel">
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="bg-transparent outline-none text-sm w-full">
              <option value="">All</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FilterPicker>
          <FilterPicker label="Sort">
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="bg-transparent outline-none text-sm w-full">
              {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </FilterPicker>
          <FilterPicker label="Customer ID">
            <input value={customerId} onChange={(e) => { setCustomerId(e.target.value); setPage(1); }} placeholder="100123" className="bg-transparent outline-none text-sm w-full" />
          </FilterPicker>
          <FilterPicker label="Merchant">
            <input value={merchant} onChange={(e) => { setMerchant(e.target.value); setPage(1); }} placeholder="Amazon India" className="bg-transparent outline-none text-sm w-full" />
          </FilterPicker>
          <FilterPicker label="City">
            <input value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }} placeholder="Mumbai" className="bg-transparent outline-none text-sm w-full" />
          </FilterPicker>
          <FilterPicker label="Min ₹">
            <input value={minAmt} onChange={(e) => { setMinAmt(e.target.value); setPage(1); }} type="number" placeholder="0" className="bg-transparent outline-none text-sm w-full" />
          </FilterPicker>
          <FilterPicker label="Max ₹">
            <input value={maxAmt} onChange={(e) => { setMaxAmt(e.target.value); setPage(1); }} type="number" placeholder="500000" className="bg-transparent outline-none text-sm w-full" />
          </FilterPicker>
          <FilterPicker label="From">
            <input value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} type="date" className="bg-transparent outline-none text-sm w-full" />
          </FilterPicker>
          <FilterPicker label="To">
            <input value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} type="date" className="bg-transparent outline-none text-sm w-full" />
          </FilterPicker>
        </div>
      </section>

      <section className="surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide muted bg-[var(--bg)]">
                <th className="px-4 py-2 font-medium">Txn ID</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Merchant</th>
                <th className="px-4 py-2 font-medium">City</th>
                <th className="px-4 py-2 font-medium">Channel</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data.map((t) => (
                <tr key={t.transaction_id} className="hover:bg-[var(--bg)]">
                  <td className="px-4 py-2 tabular-nums muted">#{t.transaction_id}</td>
                  <td className="px-4 py-2 tabular-nums">{t.transaction_date}</td>
                  <td className="px-4 py-2 tabular-nums muted">{t.customer_id}</td>
                  <td className="px-4 py-2 font-medium">{t.merchant}</td>
                  <td className="px-4 py-2 muted">{t.city}</td>
                  <td className="px-4 py-2">
                    <span className="px-1.5 py-0.5 rounded-md text-xs bg-accent/10 text-accent font-medium">
                      {t.transaction_type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{inr.format(t.amount)}</td>
                  <td className="px-4 py-2">
                    {t.is_fraud ? (
                      <span className="px-1.5 py-0.5 rounded-md text-xs bg-danger/10 text-danger font-medium">Fraud</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md text-xs bg-success/10 text-success font-medium">OK</span>
                    )}
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center muted text-sm">Loading…</td>
                </tr>
              )}
              {data && data.data.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center muted text-sm">No transactions match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t flex items-center justify-between px-4 py-3 text-xs muted">
          <span>
            {data
              ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, data.total)} of ${intFmt.format(data.total)}`
              : ""}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2 py-1.5 rounded-md surface disabled:opacity-40 inline-flex items-center gap-1 hover:bg-[var(--bg)]"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="px-2">
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2 py-1.5 rounded-md surface disabled:opacity-40 inline-flex items-center gap-1 hover:bg-[var(--bg)]"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterPicker({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider muted">{label}</span>
      <div className="mt-1 surface px-3 py-2">{children}</div>
    </label>
  );
}
