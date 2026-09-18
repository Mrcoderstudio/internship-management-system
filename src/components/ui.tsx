import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  accent = "cyan",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "cyan" | "amber" | "emerald" | "violet";
}) {
  const accents: Record<string, string> = {
    cyan: "from-cyan-accent/30 to-transparent text-cyan-soft",
    amber: "from-amber-400/30 to-transparent text-amber-300",
    emerald: "from-emerald-400/30 to-transparent text-emerald-300",
    violet: "from-violet-400/30 to-transparent text-violet-300",
  };
  return (
    <div className="card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accents[accent]} blur-2xl`} />
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accents[accent].split(" ").pop()}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "badge-approved"
      : status === "rejected"
        ? "badge-rejected"
        : status === "submitted"
          ? "badge-submitted"
          : "badge-pending";
  return <span className={cls}>{status}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-accent to-cyan-soft transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-accent/10 text-2xl">📭</div>
      <p className="font-semibold text-white">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

export function formatDate(d: Date | string | null | undefined, withTime = false) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function deadlineInfo(deadline: Date | string | null | undefined) {
  if (!deadline) return { label: "No deadline", tone: "text-slate-400" };
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, tone: "text-red-300" };
  if (days === 0) return { label: "Due today", tone: "text-amber-300" };
  if (days <= 3) return { label: `Due in ${days}d`, tone: "text-amber-300" };
  return { label: `Due in ${days}d`, tone: "text-emerald-300" };
}
