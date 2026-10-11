import { AlertCircle, Inbox } from "lucide-react";
import { cn } from "./utils";

export function LoadingSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="Memuat data">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-12 text-center">
      <Inbox className="h-8 w-8 text-slate-300" />
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {description ? <p className="max-w-sm text-xs text-slate-400">{description}</p> : null}
    </div>
  );
}

export function ErrorState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-rose-400" />
      <p className="text-sm font-semibold text-rose-700">{title}</p>
      {description ? <p className="max-w-sm text-xs text-rose-500">{description}</p> : null}
    </div>
  );
}
