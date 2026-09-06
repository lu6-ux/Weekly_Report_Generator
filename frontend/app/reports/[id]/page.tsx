"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Send,
  Check,
  MessageSquareText,
  CalendarDays,
  ListChecks,
  Trophy,
  TriangleAlert,
  Clock3,
  CalendarArrowUp,
  Link2,
  History,
  ChevronDown,
  Files,
  CircleCheck,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Report, date, label } from "@/lib/types";
import { Shell, useCurrentUser } from "@/components/Shell";
import {
  Alert,
  Avatar,
  EmptyState,
  LoadingState,
  Progress,
  SectionHeader,
  StatusBadge,
} from "@/components/UI";
import VersionSnapshot from "@/components/VersionSnapshot";
import ReviewModal, { ReviewSelection } from "@/components/ReviewModal";
function ReportActions({
  report,
  refresh,
}: {
  report: Report;
  refresh: () => void;
}) {
  const user = useCurrentUser();
  const [selection, setSelection] = useState<ReviewSelection | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      await api(`/reports/${report.id}/submit`, { method: "PATCH" });
      setSuccess("Report submitted for review.");
      refresh();
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const owner = user?.id === report.userId;
  const manager = user && user.role !== "MEMBER";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={manager ? "/manager" : "/dashboard"}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={14} />
          Back to {manager ? "Team Dashboard" : "Dashboard"}
        </Link>
        <div className="flex flex-wrap gap-2">
          {owner && ["DRAFT", "NEEDS_CORRECTION"].includes(report.status) && (
            <>
              <Link
                href={`/reports/${report.id}/edit`}
                className="btn-secondary"
              >
                <Pencil size={14} />
                Edit Report
              </Link>
              <button className="btn" disabled={busy} onClick={submit}>
                <Send size={14} />
                {busy
                  ? "Submitting..."
                  : report.status === "NEEDS_CORRECTION"
                    ? "Resubmit Report"
                    : "Submit Report"}
              </button>
            </>
          )}
          {manager && report.status === "SUBMITTED" && (
            <>
              <button
                className="btn-secondary"
                onClick={() =>
                  setSelection({ report, action: "request-correction" })
                }
              >
                <MessageSquareText size={14} />
                Request Changes
              </button>
              <button
                className="btn"
                onClick={() => setSelection({ report, action: "approve" })}
              >
                <Check size={14} />
                Approve Report
              </button>
            </>
          )}
        </div>
      </div>
      {message && <Alert>{message}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      {selection && (
        <ReviewModal
          selection={selection}
          onClose={() => setSelection(null)}
          onReviewed={() => {
            refresh();
            setSuccess("Review saved successfully.");
          }}
        />
      )}
    </div>
  );
}
export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    api<{ report: Report }>(`/reports/${id}`)
      .then((d) => {
        if (active) setReport(d.report);
      })
      .catch((e) => {
        if (active) setMessage(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [id]);
  function refresh() {
    api<{ report: Report }>(`/reports/${id}`)
      .then((d) => setReport(d.report))
      .catch((e) => setMessage(errorMessage(e)));
  }
  return (
    <Shell
      title="Weekly Report"
      subtitle="A complete view of the week, from progress to feedback."
    >
      {message && <Alert>{message}</Alert>}
      {!report && !message && <LoadingState />}
      {report && (
        <>
          <ReportActions report={report} refresh={refresh} />
          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Files size={23} />
                </span>
                <div>
                  <h2 className="text-lg">{report.project.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays size={13} />
                    {date(report.weekStart)} to {date(report.weekEnd)}
                  </p>
                </div>
              </div>
              <StatusBadge status={report.status} />
            </div>
            <div className="grid gap-6 py-5 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Employee
                </p>
                <div className="flex items-center gap-2">
                  <Avatar name={report.user.name} small />
                  <div>
                    <p className="text-xs font-semibold">{report.user.name}</p>
                    <p className="mt-0.5 break-all text-[10px] text-slate-400">
                      {report.user.email}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Project
                </p>
                <p className="text-xs font-medium">{report.project.name}</p>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Reporting week
                </p>
                <p className="text-xs font-medium">
                  {date(report.weekStart)} - {date(report.weekEnd)}
                </p>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </p>
                <StatusBadge status={report.status} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-4">
              {[
                {
                  title: "Total tasks",
                  value: report.tasks.length,
                  icon: ListChecks,
                },
                {
                  title: "Completed",
                  value: report.tasks.filter((t) => t.status === "COMPLETED")
                    .length,
                  icon: CircleCheck,
                },
                {
                  title: "Actual hours",
                  value: report.tasks.reduce(
                    (sum, t) => sum + (t.actualHours || 0),
                    0,
                  ),
                  icon: Clock3,
                },
              ].map(({ title, value, icon: Icon }) => (
                <div key={title} className="flex items-center gap-3">
                  <Icon size={18} className="hidden text-indigo-400 sm:block" />
                  <div>
                    <p className="text-xl font-semibold tabular-nums">
                      {value}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="table-panel">
            <div className="px-5 pt-5">
              <SectionHeader
                title="Task Breakdown"
                icon={ListChecks}
                description="Planned effort and the progress made this week."
              />
            </div>
            {report.tasks.length ? (
              <div className="table-scroll">
                <table className="min-w-[950px]">
                  <thead>
                    <tr>
                      {[
                        "Task",
                        "Priority",
                        "Status",
                        "Planned",
                        "Actual",
                        "Planned Hours",
                        "Actual Hours",
                        "Output",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.tasks.map((t, i) => (
                      <tr key={i}>
                        <td className="max-w-56 font-semibold">{t.taskName}</td>
                        <td>
                          <StatusBadge status={t.priority} />
                        </td>
                        <td>
                          <StatusBadge status={t.status} />
                        </td>
                        <td>
                          <Progress value={t.plannedPercent} />
                        </td>
                        <td>
                          <Progress value={t.actualPercent} />
                        </td>
                        <td className="tabular-nums">
                          {t.plannedHours ?? 0}{" "}
                          <span className="text-slate-400">hrs</span>
                        </td>
                        <td className="tabular-nums">
                          {t.actualHours ?? 0}{" "}
                          <span className="text-slate-400">hrs</span>
                        </td>
                        <td className="max-w-56 break-words text-slate-500">
                          {t.output || "No output recorded"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                compact
                title="No tasks added"
                description="This report does not include any tasks."
              />
            )}
          </section>
          <div className="grid gap-5 xl:grid-cols-2">
            {(["achievements", "blockers"] as const).map((key) => (
              <section className="card" key={key}>
                <SectionHeader
                  title={label(key)}
                  icon={key === "achievements" ? Trophy : TriangleAlert}
                />
                {report[key].length ? (
                  <ul className="space-y-3">
                    {report[key].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm leading-6 text-slate-600"
                      >
                        <span
                          className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${key === "achievements" ? "bg-emerald-400" : "bg-amber-400"}`}
                        />
                        <span className="whitespace-pre-wrap break-words">
                          {item.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">
                    {key === "achievements"
                      ? "No achievements added."
                      : "No blockers reported this week."}
                  </p>
                )}
              </section>
            ))}
          </div>
          <section className="table-panel">
            <div className="px-5 pt-5">
              <SectionHeader
                title="Work Hours"
                icon={Clock3}
                description="A breakdown of time by work category."
                action={
                  <span className="badge badge-blue">
                    {report.workHours.reduce((sum, w) => sum + w.hours, 0)}{" "}
                    hours logged
                  </span>
                }
              />
            </div>
            {report.workHours.length ? (
              <div className="table-scroll">
                <table className="min-w-[450px]">
                  <thead>
                    <tr>
                      <th>Work Type</th>
                      <th>Hours</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.workHours.map((w, i) => (
                      <tr key={i}>
                        <td className="font-medium">{label(w.workType)}</td>
                        <td className="tabular-nums">{w.hours} hrs</td>
                        <td className="text-slate-500">
                          {w.notes || "No notes"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                compact
                title="No work hours logged"
                description="No categorized time entries were added to this report."
              />
            )}
          </section>
          <div className="grid gap-5 xl:grid-cols-2">
            {(["nextWeekPlans", "notes"] as const).map((key) => (
              <section className="card" key={key}>
                <SectionHeader
                  title={
                    key === "nextWeekPlans"
                      ? "Next Week Plans"
                      : "Notes & Links"
                  }
                  icon={key === "nextWeekPlans" ? CalendarArrowUp : Link2}
                />
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-500">
                  {report[key] || "Nothing added yet."}
                </p>
              </section>
            ))}
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <section className="card">
              <SectionHeader
                title="Review History"
                icon={MessageSquareText}
                description="Feedback and decisions from your manager."
              />
              {!report.reviews.length ? (
                <EmptyState
                  compact
                  title="No manager reviews yet"
                  description="Feedback will appear here once your report is reviewed."
                  icon={MessageSquareText}
                />
              ) : (
                <ol className="ml-4 border-l border-slate-200">
                  {report.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="relative pb-7 pl-6 last:pb-0"
                    >
                      <span
                        className={`absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white ${review.action === "APPROVED" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                      >
                        {review.action === "APPROVED" ? (
                          <Check size={12} />
                        ) : (
                          <MessageSquareText size={12} />
                        )}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold">
                          {review.reviewer.name}
                        </p>
                        <StatusBadge status={review.action} />
                      </div>
                      <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                        {review.comment}
                      </p>
                      <p className="mt-2 text-[10px] text-slate-400">
                        {new Date(review.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section className="card">
              <SectionHeader
                title="Version History"
                icon={History}
                description="A saved snapshot of every submission, newest first."
              />
              {!report.versions?.length && (
                <EmptyState
                  compact
                  title="No submissions yet"
                  description="Submit this report to create the first version."
                  icon={History}
                />
              )}
              {report.versions?.map((version) => (
                <details
                  key={version.id}
                  className="group mb-3 rounded-lg border border-slate-200 p-4 last:mb-0"
                >
                  <summary className="flex list-none items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                        V{version.versionNo}
                      </span>
                      <div>
                        <p className="text-xs font-semibold">
                          Version {version.versionNo}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(version.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={version.reviews[0]?.action || "SUBMITTED"}
                      />
                      <ChevronDown
                        size={14}
                        className="text-slate-400 group-open:rotate-180"
                      />
                    </div>
                  </summary>
                  {version.reviews.map((r) => (
                    <p
                      className="mt-3 text-xs leading-6 text-slate-500"
                      key={r.id}
                    >
                      <strong>{r.reviewer.name}:</strong> {r.comment}
                    </p>
                  ))}
                  <VersionSnapshot snapshot={version.snapshot} />
                </details>
              ))}
            </section>
          </div>
        </>
      )}
    </Shell>
  );
}
