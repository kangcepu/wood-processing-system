"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "../../components/layout/app-sidebar";
import { AppHeader } from "../../components/layout/app-header";
import { PageHeaderProvider } from "../../components/layout/page-header-context";
import { useAuthBootstrap } from "../../providers/auth-provider";
import { useMe } from "../../hooks/use-auth";

export default function ShellLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isReady } = useAuthBootstrap();
  const { data: user } = useMe();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <PageHeaderProvider>
      <div className="flex min-h-screen bg-slate-50">
        <AppSidebar open={sidebarOpen} collapsed={collapsed} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col">
          <AppHeader onToggleSidebar={() => setCollapsed((v) => !v)} collapsed={collapsed} />
          <main className="flex-1 lg:ml-0">{children}</main>
        </div>
        <button
          className="fixed bottom-4 right-4 z-40 rounded-full bg-brand-600 p-3 text-white shadow-lg lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka menu"
        >
          Menu
        </button>
      </div>
    </PageHeaderProvider>
  );
}
