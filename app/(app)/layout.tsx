import type { ReactNode } from "react";
import { Sidebar, MobileTopbar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <MobileTopbar />
          <main className="px-4 md:px-8 py-6 md:py-8 max-w-[1500px] mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
