"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronLeft, UserCog, Wifi, WifiOff } from "lucide-react";
import { cn } from "@wps/ui";
import { useMe, useLogout } from "../../hooks/use-auth";
import { useNotificationSummary } from "../../hooks/use-notifications";
import { usePageHeader } from "./page-header-context";
import { useRealtimeConnectionState } from "../../providers/socket-provider";
import { formatNumber, initials } from "../../lib/format";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return {
    time: now ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
    date: now ? now.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "",
  };
}

export function AppHeader({ onToggleSidebar, collapsed }: { onToggleSidebar: () => void; collapsed: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useMe();
  const displayName = user?.fullname || "Memuat…";
  const avatarInitials = initials(user?.fullname);
  const logout = useLogout();
  const { header } = usePageHeader();
  const clock = useClock();
  const connectionState = useRealtimeConnectionState();
  const [notifOpen, setNotifOpen] = useState(false);
  const notif = useNotificationSummary();
  const unreadCount = notif.data?.data.unreadCount ?? 0;

  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = () => setNotifOpen(false);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [notifOpen]);

  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const title = header.title || "Dashboard";
  const subtitle = segment === "dashboard" ? "Dashboard" : `Dashboard → ${title}`;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white pr-4">
      <button
        onClick={onToggleSidebar}
        aria-label={collapsed ? "Buka menu" : "Tutup menu"}
        className="relative z-50 grid h-16 w-10 shrink-0 place-items-center rounded-r-[2rem] border-y border-r border-white/10 bg-gradient-to-b from-[#09111f] to-[#070d18] text-white shadow-[0_10px_20px_rgba(5,11,23,0.18)] transition-colors hover:from-[#111d31] hover:to-[#0d1728]"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")} />
      </button>

      <div className="min-w-0 flex-1 py-2">
        <p className="truncate text-[15px] font-semibold leading-tight text-slate-900">{title}</p>
        <p className="truncate text-xs leading-tight text-slate-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="hidden items-center gap-1.5 border-r border-slate-200 pr-4 sm:flex"
          title={connectionState === "connected" ? "Realtime tersambung" : "Realtime terputus"}
        >
          {connectionState === "connected" ? (
            <Wifi className="h-4 w-4 text-emerald-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-slate-400" />
          )}
        </div>

        <div className="hidden min-w-[152px] items-center justify-center gap-2 border-r border-slate-200 pr-4 sm:flex">
          <div className="min-w-[104px] text-center leading-tight">
            <p className="font-mono text-sm font-semibold tabular-nums text-slate-800">{clock.time || "--:--"}</p>
            <p className="text-[11px] text-slate-400">{clock.date || "-- --- ----"}</p>
          </div>
        </div>

        <div className="relative">
          <button
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Notifikasi"
            onClick={(e) => {
              e.stopPropagation();
              setNotifOpen((v) => !v);
            }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>

          {notifOpen ? (
            <div
              className="absolute right-0 top-full z-40 mt-1 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">Notifikasi</p>
                <span className="text-xs text-slate-400">{formatNumber(unreadCount)} belum dibaca</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  {unreadCount === 0 ? "Tidak ada notifikasi baru." : "Lihat daftar lengkap notifikasi."}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="group relative">
          <button className="flex min-w-0 items-center gap-2" aria-label="Menu profil">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold tracking-tight text-brand-700 ring-1 ring-brand-200"
            >
              {avatarInitials}
            </span>
            <span className="hidden max-w-[220px] truncate text-sm font-medium text-slate-800 sm:block">{displayName}</span>
          </button>
          <div className="invisible absolute right-0 top-full z-40 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-800">{displayName}</p>
              <p className="truncate text-xs text-slate-400">{user?.email || user?.username}</p>
            </div>
            <Link href="/profile" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
              <UserCog className="h-4 w-4 text-slate-400" />
              Profil
            </Link>
            <button
              onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace("/login") })}
              className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
