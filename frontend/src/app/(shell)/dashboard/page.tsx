"use client";

import { Bell, KeyRound, ShieldCheck } from "lucide-react";
import { PageContainer } from "../../../components/layout/page-container";
import { useMe, useSessions } from "../../../hooks/use-auth";
import { useNotificationSummary } from "../../../hooks/use-notifications";

export default function DashboardPage() {
  const { data: user } = useMe();
  const sessions = useSessions();
  const notifications = useNotificationSummary();
  const activeSessions = sessions.data?.filter((session) => !session.revokedAt).length ?? 0;

  return (
    <PageContainer
      title={`Selamat datang, ${user?.fullname ?? ""}`}
      description="Ringkasan akun Anda. Modul operasional lain akan tersedia pada fase pengembangan berikutnya."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={ShieldCheck} label="Role Aktif" value={user?.roles.map((role) => role.name).join(", ") || "-"} />
        <SummaryCard icon={KeyRound} label="Sesi Aktif" value={String(activeSessions)} />
        <SummaryCard icon={Bell} label="Notifikasi Belum Dibaca" value={String(notifications.data?.data.unreadCount ?? 0)} />
      </div>
    </PageContainer>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
