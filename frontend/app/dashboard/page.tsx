"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Files,
  FilePenLine,
  Send,
  CircleCheck,
  ArrowUpRight,
  CircleHelp,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Report, statuses, label } from "@/lib/types";
import { Shell, useCurrentUser } from "@/components/Shell";
import { Alert, EmptyState, LoadingState, StatCard } from "@/components/UI";
import ReportTable from "@/components/ReportTable";
function Greeting() {
  const user = useCurrentUser();
  const hour = new Date().getHours();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
      <div>
        <p className="font-semibold text-slate-800">
          Good {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"},{" "}
          {user?.name.split(" ")[0]}.
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Here&apos;s an overview of your weekly reporting.
        </p>
      </div>
      <span className="text-xs font-medium text-indigo-500">
        A little progress, every week.
      </span>
    </div>
  );
}
export default function DashboardPage() {
  const user = useCurrentUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    api<{ reports: Report[] }>("/reports/my")
      .then((d) => setReports(d.reports))
      .catch((e) => setMessage(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  async function submit(id: string) {
    setBusy(id);
    setMessage("");
    setSuccess("");
    try {
      await api(`/reports/${id}/submit`, { method: "PATCH" });
      const data = await api<{ reports: Report[] }>("/reports/my");
      setReports(data.reports);
      setSuccess("Report submitted. Your manager can now review it.");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  const filtered = reports.filter((r) => !status || r.status === status);
  return (
    <Shell
      title="Dashboard"
      subtitle="Your work, your progress, all in one place."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/help"
            title="How to Use"
            aria-label="How to use this system"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <CircleHelp size={20} strokeWidth={2} />
          </Link>
          {user?.role === "MEMBER" && (
            <Link href="/reports/new" className="btn">
              <Plus size={16} />
              Create Report
            </Link>
          )}
        </div>
      }
    >
      <Greeting />
      {message && <Alert>{message}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              title="Total Reports"
              value={reports.length}
              icon={Files}
              hint="All your weekly updates"
            />
            <StatCard
              title="Draft Reports"
              value={reports.filter((r) => r.status === "DRAFT").length}
              icon={FilePenLine}
              hint="Ready when you are"
              tone="neutral"
            />
            <StatCard
              title="Submitted Reports"
              value={reports.filter((r) => r.status === "SUBMITTED").length}
              icon={Send}
              hint="Awaiting manager review"
            />
            <StatCard
              title="Approved Reports"
              value={reports.filter((r) => r.status === "APPROVED").length}
              icon={CircleCheck}
              hint="Reviewed and signed off"
              tone="green"
            />
          </div>
          <section id="my-reports" className="table-panel scroll-mt-5">
            <div className="table-toolbar">
              <div>
                <h2>My Weekly Reports</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Manage updates and keep your week on track.
                </p>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                {reports.length} reports
              </span>
            </div>
            <div className="filter-tabs border-b border-slate-100 px-4 py-3">
              {["", ...statuses].map((s) => (
                <button
                  key={s}
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                  className={`filter-tab ${status === s ? "filter-tab-active" : ""}`}
                >
                  {s ? label(s) : "All Reports"}
                </button>
              ))}
            </div>
            {filtered.length ? (
              <ReportTable reports={filtered} busy={busy} onSubmit={submit} />
            ) : (
              <EmptyState
                title={
                  reports.length
                    ? "No reports with this status"
                    : "No weekly reports yet"
                }
                description={
                  reports.length
                    ? "Choose another status to see more of your weekly reports."
                    : "Create your first weekly report to start tracking your progress."
                }
                action={
                  reports.length ? (
                    <button
                      className="btn-secondary"
                      onClick={() => setStatus("")}
                    >
                      Clear filter
                    </button>
                  ) : user?.role === "MEMBER" ? (
                    <Link className="btn" href="/reports/new">
                      <Plus size={16} />
                      Create Report
                    </Link>
                  ) : null
                }
              />
            )}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-[11px] text-slate-400">
                <span>
                  Showing {filtered.length} of {reports.length} reports
                </span>
                {user?.role === "MEMBER" && (
                  <Link
                    className="inline-flex items-center gap-1 font-medium text-indigo-600"
                    href="/reports/new"
                  >
                    Add this week&apos;s update <ArrowUpRight size={13} />
                  </Link>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}
