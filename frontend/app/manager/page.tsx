"use client";
import { useEffect, useState } from "react";
import {
  Files,
  Clock3,
  MessageSquareText,
  Search,
  SlidersHorizontal,
  FolderKanban,
  Send,
  Check,
  History,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api, errorMessage } from "@/lib/api";
import { Report, date, label, statuses, workTypes } from "@/lib/types";
import { Shell } from "@/components/Shell";
import { Alert, EmptyState, LoadingState, StatCard } from "@/components/UI";
import ReportTable from "@/components/ReportTable";
import ReviewModal, { ReviewSelection } from "@/components/ReviewModal";
import AIChatAssistant from "@/components/AIChatAssistant";
const colors = ["#cbd5e1", "#6366f1", "#f5b546", "#34b58a"];
const chartColors = {
  draft: "#94a3b8",
  submitted: "#6366f1",
  correction: "#f59e0b",
  approved: "#34b58a",
};
function startOfCurrentWeek() {
  const result = new Date();
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}
function endOfCurrentWeek() {
  const result = startOfCurrentWeek();
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}
function isBetween(value: string, start: Date, end: Date) {
  const dateValue = new Date(value);
  return dateValue >= start && dateValue <= end;
}
export default function ManagerDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [employee, setEmployee] = useState("");
  const [project, setProject] = useState("");
  const [week, setWeek] = useState("");
  const [selection, setSelection] = useState<ReviewSelection | null>(null);
  useEffect(() => {
    api<{ reports: Report[] }>("/reports/all")
      .then((d) => setReports(d.reports))
      .catch((e) => setMessage(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  const filtered = reports.filter(
    (r) =>
      (!status || r.status === status) &&
      (!employee ||
        `${r.user.name} ${r.user.email}`
          .toLowerCase()
          .includes(employee.toLowerCase())) &&
      (!project || r.project.id === project) &&
      (!week || (date(r.weekStart) <= week && date(r.weekEnd) >= week)),
  );
  const statusData = statuses.map((s, i) => ({
    name: label(s),
    value: filtered.filter((r) => r.status === s).length,
    color: colors[i],
  }));
  const hourData = workTypes.map((type) => ({
    name: label(type),
    hours: filtered.reduce(
      (sum, r) =>
        sum +
        r.workHours
          .filter((w) => w.workType === type)
          .reduce((total, w) => total + w.hours, 0),
      0,
    ),
  }));
  const projects = [
    ...new Map(reports.map((r) => [r.project.id, r.project])).values(),
  ];
  const currentWeekStart = startOfCurrentWeek();
  const currentWeekEnd = endOfCurrentWeek();
  const latestVersion = (report: Report) =>
    [...(report.versions || [])].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )[0];
  // Compliance covers report records that exist; the schema has no team roster or due-report assignment.
  const currentWeekReports = reports.filter(
    (report) =>
      new Date(report.weekStart) <= currentWeekEnd &&
      new Date(report.weekEnd) >= currentWeekStart,
  );
  const submittedThisWeek = reports.filter((report) => {
    const version = latestVersion(report);
    return version && isBetween(version.createdAt, currentWeekStart, currentWeekEnd);
  }).length;
  const submittedCurrentWeek = currentWeekReports.filter(
    (report) => report.status !== "DRAFT",
  );
  const pendingCurrentWeek = currentWeekReports.filter(
    (report) => report.status === "DRAFT",
  );
  const lateCurrentWeek = submittedCurrentWeek.filter((report) => {
    const version = latestVersion(report);
    return version && new Date(version.createdAt) > new Date(report.weekEnd);
  });
  const openBlockers = reports
    .filter((report) => report.status !== "APPROVED")
    .reduce((total, report) => total + report.blockers.length, 0);
  const tasksTrend = Object.values(
    reports.reduce<Record<string, { week: string; completed: number }>>(
      (groups, report) => {
        const week = date(report.weekStart);
        groups[week] ||= { week, completed: 0 };
        groups[week].completed += report.tasks.filter(
          (task) => task.status === "COMPLETED",
        ).length;
        return groups;
      },
      {},
    ),
  ).sort((a, b) => a.week.localeCompare(b.week));
  const memberStatus = Object.values(
    reports.reduce<
      Record<
        string,
        {
          member: string;
          Draft: number;
          Submitted: number;
          "Needs Correction": number;
          Approved: number;
        }
      >
    >((groups, report) => {
      const member = report.user.name;
      groups[member] ||= {
        member,
        Draft: 0,
        Submitted: 0,
        "Needs Correction": 0,
        Approved: 0,
      };
      const statusName = label(report.status) as
        | "Draft"
        | "Submitted"
        | "Needs Correction"
        | "Approved";
      groups[member][statusName] += 1;
      return groups;
    }, {}),
  );
  const projectTasks = Object.values(
    reports.reduce<
      Record<string, { project: string; completed: number; remaining: number }>
    >((groups, report) => {
      const projectName = report.project.name;
      groups[projectName] ||= { project: projectName, completed: 0, remaining: 0 };
      groups[projectName].completed += report.tasks.filter(
        (task) => task.status === "COMPLETED",
      ).length;
      groups[projectName].remaining += report.tasks.filter(
        (task) => task.status !== "COMPLETED",
      ).length;
      return groups;
    }, {}),
  );
  const activity = reports
    .flatMap((report) => {
      const versionEvents = (report.versions || []).map((version) => ({
        id: `${report.id}-version-${version.id}`,
        createdAt: version.createdAt,
        text: `${report.user.name} ${version.versionNo > 1 ? "resubmitted" : "submitted"} ${report.project.name}`,
        icon: version.versionNo > 1 ? History : Send,
      }));
      const reviewEvents = report.reviews.map((review) => ({
        id: `${report.id}-review-${review.id}`,
        createdAt: review.createdAt,
        text:
          review.action === "APPROVED"
            ? `${review.reviewer.name} approved ${report.user.name}'s report`
            : `${review.reviewer.name} requested changes on ${report.user.name}'s report`,
        icon: review.action === "APPROVED" ? Check : MessageSquareText,
      }));
      return [...versionEvents, ...reviewEvents];
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 10);
  function clear() {
    setStatus("");
    setEmployee("");
    setProject("");
    setWeek("");
  }
  return (
    <Shell
      title="Team Dashboard"
      subtitle="Monitor weekly progress and review team reports."
      managerOnly
      actions={
        <>
          <AIChatAssistant />
          <Link href="/manager/projects" className="btn-secondary">
            <FolderKanban size={16} />
            Manage Projects
          </Link>
        </>
      }
    >
      {message && <Alert>{message}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              title="Submitted This Week"
              value={submittedThisWeek}
              icon={Files}
              hint="Reports submitted this week"
            />
            <StatCard
              title="Open Blockers"
              value={openBlockers}
              icon={Clock3}
              hint="Blockers from active reports"
            />
            <StatCard
              title="Needs Correction"
              value={
                reports.filter((r) => r.status === "NEEDS_CORRECTION").length
              }
              icon={MessageSquareText}
              hint="Updates requested"
              tone="amber"
            />
            <section className="stat-card">
              <p className="text-sm font-medium text-slate-500">
                Submission Compliance
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-semibold text-emerald-600">
                    {submittedCurrentWeek.length}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">Submitted</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-600">
                    {pendingCurrentWeek.length}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">Pending</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-amber-600">
                    {lateCurrentWeek.length}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">Late</p>
                </div>
              </div>
            </section>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="card">
              <h2>Tasks Completed Over Time</h2>
              <p className="mt-1 text-xs text-slate-400">
                Completed tasks grouped by report week
              </p>
              <div className="mt-5 h-[225px] min-w-0">
                {tasksTrend.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tasksTrend} margin={{ left: 0, right: 12 }}>
                      <CartesianGrid stroke="#eef0f5" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed" name="Completed Tasks" stroke="#34b58a" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState compact title="No task data" description="Completed task trends will appear here." />
                )}
              </div>
            </section>
            <section className="card">
              <h2>Report Status by Team Member</h2>
              <p className="mt-1 text-xs text-slate-400">
                Report counts grouped by employee
              </p>
              <div className="mt-5 h-[225px] min-w-0">
                {memberStatus.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberStatus} margin={{ left: 0, right: 12 }}>
                      <CartesianGrid stroke="#eef0f5" vertical={false} />
                      <XAxis dataKey="member" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Draft" stackId="status" fill={chartColors.draft} />
                      <Bar dataKey="Submitted" stackId="status" fill={chartColors.submitted} />
                      <Bar dataKey="Needs Correction" stackId="status" fill={chartColors.correction} />
                      <Bar dataKey="Approved" stackId="status" fill={chartColors.approved} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState compact title="No member data" description="Member status data will appear here." />
                )}
              </div>
            </section>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="card">
              <h2>Tasks by Project</h2>
              <p className="mt-1 text-xs text-slate-400">
                Completed and remaining tasks across projects
              </p>
              <div className="mt-5 h-[225px] min-w-0">
                {projectTasks.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectTasks} layout="vertical" margin={{ left: 0, right: 12 }}>
                      <CartesianGrid horizontal={false} stroke="#eef0f5" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis dataKey="project" type="category" width={110} tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="completed" name="Completed" stackId="tasks" fill="#34b58a" />
                      <Bar dataKey="remaining" name="Remaining" stackId="tasks" fill="#cbd5e1" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState compact title="No project data" description="Project task distribution will appear here." />
                )}
              </div>
            </section>
            <section className="card">
              <h2>Recent Activity</h2>
              <p className="mt-1 text-xs text-slate-400">
                Latest submissions, approvals, and requested changes
              </p>
              {activity.length ? (
                <div className="mt-5 space-y-4">
                  {activity.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Icon size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700">{item.text}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {new Date(item.createdAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState compact title="No recent activity" description="Report activity will appear here." />
              )}
            </section>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2>Report Status Overview</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    A snapshot of your team&apos;s reporting progress
                  </p>
                </div>
                <span className="badge badge-neutral">
                  {filtered.length} reports
                </span>
              </div>
              {filtered.length ? (
                <div className="mt-4 grid items-center gap-4 sm:grid-cols-[1fr_160px]">
                  <div className="relative h-[225px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          isAnimationActive={false} dataKey="value"
                          nameKey="name"
                          innerRadius={68}
                          outerRadius={87}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {statusData.map((s) => (
                            <Cell key={s.name} fill={s.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: "1px solid #e2e8f0",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-semibold tabular-nums">
                        {filtered.length}
                      </span>
                      <span className="mt-1 text-[11px] text-slate-400">
                        Total reports
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {statusData.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: s.color }}
                        />
                        <span className="text-slate-500">{s.name}</span>
                        <span className="ml-auto font-semibold tabular-nums">
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  compact
                  title="No report data"
                  description="Reports matching your filters will appear here."
                />
              )}
            </section>
            <section className="card">
              <h2>Work Hours by Category</h2>
              <p className="mt-1 text-xs text-slate-400">
                Where your team is spending time
              </p>
              <div className="mt-5 h-[225px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourData}
                    layout="vertical"
                    margin={{ left: 0, right: 16 }}
                    barSize={11}
                  >
                    <CartesianGrid horizontal={false} stroke="#eef0f5" />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={98}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar isAnimationActive={false} dataKey="hours" fill="#818cf8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
          <section className="table-panel">
            <div className="table-toolbar">
              <div>
                <h2>Team Reports</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Review updates, celebrate progress, and keep work moving.
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <SlidersHorizontal size={14} />
                {filtered.length} reports
              </span>
            </div>
            <div className="grid gap-3 border-b border-slate-100 bg-slate-50/40 p-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="relative">
                <span>Search employee</span>
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-3.5 text-slate-400"
                  />
                  <input
                    className="pl-9"
                    placeholder="Name or email..."
                    value={employee}
                    onChange={(e) => setEmployee(e.target.value)}
                  />
                </div>
              </label>
              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Project
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                >
                  <option value="">All projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Week containing date
                <input
                  type="date"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                />
              </label>
            </div>
            {filtered.length ? (
              <ReportTable
                manager
                reports={filtered}
                onReview={(report, action) => setSelection({ report, action })}
              />
            ) : (
              <EmptyState
                title="No reports found"
                description="Try another search or adjust your filters to find team reports."
                action={
                  <button className="btn-secondary" onClick={clear}>
                    Clear filters
                  </button>
                }
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4 text-[11px] text-slate-400">
              <span>
                Showing {filtered.length} of {reports.length} reports
              </span>
              <span>
                Charts reflect filters &middot; Summary cards show all reports
              </span>
            </div>
          </section>
        </>
      )}
      {selection && (
        <ReviewModal
          selection={selection}
          onClose={() => setSelection(null)}
          onReviewed={(report) => {
            setReports((old) =>
              old.map((r) => (r.id === report.id ? report : r)),
            );
            setSuccess(
              report.status === "APPROVED"
                ? "Report approved successfully."
                : "Changes requested. Your feedback is available to the team member.",
            );
          }}
        />
      )}
    </Shell>
  );
}
