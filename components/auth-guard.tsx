"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (getSession()) setOk(true);
    else router.replace("/login");
  }, [router]);
  if (!ok) {
    return (
      <div className="min-h-screen grid place-items-center muted text-sm">Authenticating…</div>
    );
  }
  return <>{children}</>;
}
