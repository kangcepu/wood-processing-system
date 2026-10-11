import { cn } from "@wps/ui";

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-800",
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-rose-100 text-rose-700",
};

const STATUS_TONE: Record<string, keyof typeof TONE_CLASS> = {
  DRAFT: "neutral",
  NEGOTIATION: "info",
  PENDING_CONFIRMATION: "warning",
  CONFIRMED: "success",
  REVISED: "warning",
  FULFILLED: "success",
  CLOSED: "neutral",
  CANCELLED: "danger",
  FEASIBILITY: "info",
  REVIEW: "warning",
  WAITING_BUYER_CONFIRMATION: "warning",
  CONVERTED: "success",
  APPROVED: "info",
  RELEASED: "success",
  SCHEDULED: "info",
  IN_PRODUCTION: "info",
  FINAL_QC: "warning",
  READY_FOR_SHIPMENT: "success",
  SHIPPED: "success",
  COMPLETED: "success",
  HOLD: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", TONE_CLASS[tone])}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
