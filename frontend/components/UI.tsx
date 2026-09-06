"use client";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { label } from "@/lib/types";
export function Alert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "success" | "warning";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`alert alert-${tone}`}
    >
      <AlertCircle size={18} className="shrink-0 mt-0.5" />
      <div className="min-w-0 whitespace-pre-wrap">{children}</div>
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    DRAFT: "neutral",
    SUBMITTED: "blue",
    NEEDS_CORRECTION: "amber",
    APPROVED: "green",
    LOW: "neutral",
    MEDIUM: "blue",
    HIGH: "amber",
    URGENT: "red",
    NOT_STARTED: "neutral",
    IN_PROGRESS: "blue",
    COMPLETED: "green",
    BLOCKED: "red",
  };
  return (
    <span className={`badge badge-${tones[status] || "neutral"}`}>
      <span className="badge-dot" />
      {label(status)}
    </span>
  );
}
export function StatCard({
  title,
  value,
  icon: Icon = FileText,
  hint,
  tone = "indigo",
}: {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={`stat-icon stat-${tone}`}>
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-2 text-[30px] font-semibold tracking-tight tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  compact = false,
  icon: Icon = Inbox,
}: {
  title?: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className={`empty-state ${compact ? "py-6" : "py-14"}`}>
      <div className="empty-icon">
        <Icon size={23} strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function LoadingState() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-6">
      <span className="sr-only">Loading page</span>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card space-y-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-14" />
            <div className="skeleton h-2 w-32 max-w-full" />
          </div>
        ))}
      </div>
      <div className="card space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
export function Progress({ value }: { value: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="min-w-20 max-w-36">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium tabular-nums">
        <span>{percent}%</span>
        {percent === 100 && (
          <CheckCircle2 size={12} className="text-emerald-600" />
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Task progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full ${percent === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
export function SectionHeader({
  title,
  description,
  icon: Icon = FileText,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <div className="flex items-start gap-3">
        <span className="section-icon">
          <Icon size={18} />
        </span>
        <div>
          <h2>{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
export function Avatar({
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`avatar ${small ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"}`}
    >
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}
