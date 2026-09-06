"use client";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import {
  emptyTask,
  label,
  Project,
  Report,
  ReportInput,
  Task,
  workTypes,
} from "@/lib/types";
import { Shell } from "./Shell";
import {
  Alert,
  EmptyState,
  LoadingState,
  SectionHeader,
  StatusBadge,
} from "./UI";
import {
  ArrowLeft,
  CalendarDays,
  ListChecks,
  TriangleAlert,
  Trophy,
  Clock3,
  CalendarArrowUp,
  Link2,
  Plus,
  Trash2,
  Save,
  LoaderCircle,
} from "lucide-react";
const initial: ReportInput = {
  weekStart: "",
  weekEnd: "",
  projectId: "",
  nextWeekPlans: "",
  notes: "",
  tasks: [emptyTask()],
  blockers: [],
  achievements: [],
  workHours: [],
};
export default function ReportForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<ReportInput>(initial);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { projects } = await api<{ projects: Project[] }>("/projects");
        if (!active) return;
        setProjects(projects);
        if (id) {
          const { report } = await api<{ report: Report }>(`/reports/${id}`);
          if (!active) return;
          if (!["DRAFT", "NEEDS_CORRECTION"].includes(report.status))
            throw new Error(
              "This report cannot be edited after submission or approval.",
            );
          if (report.status === "NEEDS_CORRECTION")
            setFeedback(
              report.reviews.find((r) => r.action === "NEEDS_CORRECTION")
                ?.comment || "Your manager requested changes to this report.",
            );
          setForm({
            ...report,
            weekStart: report.weekStart.slice(0, 10),
            weekEnd: report.weekEnd.slice(0, 10),
            nextWeekPlans: report.nextWeekPlans || "",
            notes: report.notes || "",
            tasks: report.tasks.map((t) => ({
              ...t,
              plannedHours: t.plannedHours ?? 0,
              actualHours: t.actualHours ?? 0,
              output: t.output || "",
            })),
            workHours: report.workHours.map((w) => ({
              ...w,
              notes: w.notes || "",
            })),
          });
        }
        setAllowed(true);
      } catch (error) {
        if (active) setMessage(errorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id]);
  function field<K extends keyof ReportInput>(key: K, value: ReportInput[K]) {
    setForm((old) => ({ ...old, [key]: value }));
  }
  function taskField<K extends keyof Task>(
    index: number,
    key: K,
    value: Task[K],
  ) {
    field(
      "tasks",
      form.tasks.map((t, i) => (i === index ? { ...t, [key]: value } : t)),
    );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (form.weekEnd < form.weekStart) {
      setMessage("Week end must be on or after week start.");
      return;
    }
    if (
      form.tasks.some((t) => !t.taskName.trim()) ||
      [...form.blockers, ...form.achievements].some(
        (x) => !x.description.trim(),
      )
    ) {
      setMessage(
        "Please fill in task names and descriptions, or remove empty rows.",
      );
      return;
    }
    setSaving(true);
    try {
      await api(id ? `/reports/${id}` : "/reports", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      router.push("/dashboard");
    } catch (error) {
      setMessage(errorMessage(error));
      setSaving(false);
    }
  }
  return (
    <Shell
      title={id ? "Edit Weekly Report" : "Create Weekly Report"}
      subtitle="Record your progress, achievements and plans for the week."
      actions={
        <Link href="/dashboard" className="btn-secondary">
          <ArrowLeft size={15} />
          Back to Dashboard
        </Link>
      }
    >
      {loading && <LoadingState />}
      {message && <Alert>{message}</Alert>}
      {feedback && (
        <Alert tone="warning">
          <strong className="block">Changes Requested</strong>
          <p className="mt-1">Manager feedback: {feedback}</p>
          <p className="mt-2 text-xs">
            Update the report and resubmit it for review.
          </p>
        </Alert>
      )}
      {!loading && allowed && (
        <form onSubmit={submit} className="space-y-5">
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-200 pb-4">
            {[
              "Report Information",
              "Tasks",
              "Blockers",
              "Achievements",
              "Work Hours",
              "Next Week Plans",
              "Notes & Links",
            ].map((name, i) => (
              <a
                key={name}
                href={`#section-${i}`}
                className="text-xs font-medium text-slate-500 hover:text-indigo-600"
              >
                <span className="mr-1.5 text-slate-400">0{i + 1}</span>
                {name}
              </a>
            ))}
          </div>
          <fieldset disabled={saving} className="space-y-5">
            <section id="section-0" className="card form-section">
              <SectionHeader
                icon={CalendarDays}
                title="Report Information"
                description="Choose the project and reporting period for your update."
              />
              <div className="grid gap-5 md:grid-cols-3">
                <label>
                  Week Start
                  <input
                    type="date"
                    required
                    value={form.weekStart}
                    onChange={(e) => field("weekStart", e.target.value)}
                  />
                </label>
                <label>
                  Week End
                  <input
                    type="date"
                    required
                    min={form.weekStart}
                    value={form.weekEnd}
                    onChange={(e) => field("weekEnd", e.target.value)}
                  />
                </label>
                <label>
                  Project
                  <select
                    required
                    value={form.projectId}
                    onChange={(e) => field("projectId", e.target.value)}
                  >
                    <option value="">Select a project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {!projects.length && (
                <div className="mt-4">
                  <Alert tone="warning">
                    No projects available. Ask your manager to add a project
                    before creating a report.
                  </Alert>
                </div>
              )}
            </section>
            <section id="section-1" className="card form-section">
              <SectionHeader
                icon={ListChecks}
                title="Tasks"
                description="Break down your work and compare planned versus actual progress."
                action={
                  <span className="badge badge-neutral">
                    {form.tasks.length} tasks
                  </span>
                }
              />
              {form.tasks.map((task, index) => (
                <div key={index} className="task-card">
                  <div className="task-card-head">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-500">
                        {index + 1}
                      </span>
                      <h3 className="text-xs font-semibold">
                        Task {index + 1}
                      </h3>
                      <span className="hidden sm:inline">
                        <StatusBadge status={task.priority} />
                      </span>
                    </div>
                    <button
                      type="button"
                      className="remove-button"
                      aria-label={`Remove task ${index + 1}`}
                      onClick={() =>
                        field(
                          "tasks",
                          form.tasks.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                  <div className="space-y-5 p-5">
                    <div className="grid gap-5 md:grid-cols-4">
                      <label className="md:col-span-2">
                        Task Name
                        <input
                          required
                          placeholder="What did you work on?"
                          value={task.taskName}
                          onChange={(e) =>
                            taskField(index, "taskName", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Priority
                        <select
                          value={task.priority}
                          onChange={(e) =>
                            taskField(
                              index,
                              "priority",
                              e.target.value as Task["priority"],
                            )
                          }
                        >
                          {["LOW", "MEDIUM", "HIGH", "URGENT"].map((v) => (
                            <option key={v} value={v}>
                              {label(v)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Status
                        <select
                          value={task.status}
                          onChange={(e) =>
                            taskField(
                              index,
                              "status",
                              e.target.value as Task["status"],
                            )
                          }
                        >
                          {[
                            "NOT_STARTED",
                            "IN_PROGRESS",
                            "COMPLETED",
                            "BLOCKED",
                          ].map((v) => (
                            <option key={v} value={v}>
                              {label(v)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      {(
                        [
                          "plannedPercent",
                          "actualPercent",
                          "plannedHours",
                          "actualHours",
                        ] as const
                      ).map((key) => (
                        <label key={key}>
                          {
                            {
                              plannedPercent: "Planned Progress (%)",
                              actualPercent: "Actual Progress (%)",
                              plannedHours: "Planned Hours",
                              actualHours: "Actual Hours",
                            }[key]
                          }
                          <input
                            type="number"
                            required
                            min="0"
                            max={key.includes("Percent") ? 100 : undefined}
                            step={key.includes("Percent") ? 1 : "any"}
                            value={task[key]}
                            onChange={(e) =>
                              taskField(index, key, Number(e.target.value))
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label>
                      Output / Deliverable
                      <input
                        placeholder="e.g. Completed API, dashboard page, or documentation"
                        value={task.output}
                        onChange={(e) =>
                          taskField(index, "output", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
              {!form.tasks.length && (
                <EmptyState
                  compact
                  icon={ListChecks}
                  title="No tasks added"
                  description="Add a task to capture your work this week."
                />
              )}
              <button
                type="button"
                className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/30 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                onClick={() => field("tasks", [...form.tasks, emptyTask()])}
              >
                <Plus size={15} />
                Add Another Task
              </button>
            </section>
            <div className="grid items-start gap-5 xl:grid-cols-2">
              {(["blockers", "achievements"] as const).map((key, section) => (
                <section
                  id={`section-${section + 2}`}
                  className="card form-section"
                  key={key}
                >
                  <SectionHeader
                    icon={key === "blockers" ? TriangleAlert : Trophy}
                    title={label(key)}
                    description={
                      key === "blockers"
                        ? "What's getting in the way of your progress?"
                        : "Highlight the wins you're proud of this week."
                    }
                  />
                  {!form[key].length && (
                    <p className="mb-4 rounded-lg bg-slate-50 px-4 py-5 text-xs text-slate-400">
                      {key === "blockers"
                        ? "No blockers reported this week."
                        : "No achievements added."}
                    </p>
                  )}
                  {form[key].map((item, index) => (
                    <div key={index} className="mb-4 flex items-end gap-2">
                      <label className="min-w-0 flex-1">
                        {key === "blockers" ? "Blocker" : "Achievement"}{" "}
                        {index + 1}
                        <textarea
                          className="min-h-20"
                          required
                          placeholder={
                            key === "blockers"
                              ? "Describe the issue and any support needed..."
                              : "Share a completed milestone or a positive outcome..."
                          }
                          value={item.description}
                          onChange={(e) =>
                            field(
                              key,
                              form[key].map((v, i) =>
                                i === index
                                  ? { description: e.target.value }
                                  : v,
                              ),
                            )
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="remove-button mb-1"
                        aria-label={`Remove ${key === "blockers" ? "blocker" : "achievement"} ${index + 1}`}
                        onClick={() =>
                          field(
                            key,
                            form[key].filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      field(key, [...form[key], { description: "" }])
                    }
                  >
                    <Plus size={14} />
                    Add {key === "blockers" ? "Blocker" : "Achievement"}
                  </button>
                </section>
              ))}
            </div>
            <section id="section-4" className="card form-section">
              <SectionHeader
                icon={Clock3}
                title="Work Hours"
                description="Log how your time was spent across different types of work."
                action={
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      field("workHours", [
                        ...form.workHours,
                        { workType: "DEVELOPMENT", hours: 0, notes: "" },
                      ])
                    }
                  >
                    <Plus size={14} />
                    Add Work Hour
                  </button>
                }
              />
              {!form.workHours.length && (
                <p className="rounded-lg bg-slate-50 px-4 py-5 text-xs text-slate-400">
                  No work hours logged. Add a category to get started.
                </p>
              )}
              {form.workHours.map((item, index) => (
                <div
                  key={index}
                  className="mb-4 grid items-end gap-4 rounded-lg border border-slate-100 bg-slate-50/40 p-4 sm:grid-cols-[1fr_90px] xl:grid-cols-[1fr_100px_2fr_auto]"
                >
                  <label>
                    Work Type
                    <select
                      value={item.workType}
                      onChange={(e) =>
                        field(
                          "workHours",
                          form.workHours.map((w, i) =>
                            i === index
                              ? {
                                  ...w,
                                  workType: e.target
                                    .value as (typeof workTypes)[number],
                                }
                              : w,
                          ),
                        )
                      }
                    >
                      {workTypes.map((v) => (
                        <option key={v} value={v}>
                          {label(v)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Hours
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={item.hours}
                      onChange={(e) =>
                        field(
                          "workHours",
                          form.workHours.map((w, i) =>
                            i === index
                              ? { ...w, hours: Number(e.target.value) }
                              : w,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Notes
                    <input
                      placeholder="What was this time spent on?"
                      value={item.notes}
                      onChange={(e) =>
                        field(
                          "workHours",
                          form.workHours.map((w, i) =>
                            i === index ? { ...w, notes: e.target.value } : w,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="remove-button mb-1"
                    aria-label={`Remove work hour ${index + 1}`}
                    onClick={() =>
                      field(
                        "workHours",
                        form.workHours.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              ))}
              {form.workHours.length > 0 && (
                <p className="mt-3 text-right text-xs text-slate-500">
                  Total logged:{" "}
                  <strong className="text-slate-800">
                    {form.workHours.reduce((sum, w) => sum + w.hours, 0)} hours
                  </strong>
                </p>
              )}
            </section>
            <section id="section-5" className="card form-section">
              <SectionHeader
                icon={CalendarArrowUp}
                title="Next Week Plans"
                description="Give your team a look at what's coming next."
              />
              <label>
                <span className="sr-only">Next Week Plans</span>
                <textarea
                  placeholder="Outline your priorities, upcoming tasks, and goals for next week..."
                  value={form.nextWeekPlans}
                  onChange={(e) => field("nextWeekPlans", e.target.value)}
                />
              </label>
            </section>
            <section id="section-6" className="card form-section">
              <SectionHeader
                icon={Link2}
                title="Notes & Links"
                description="Add any additional context, references, or useful links."
              />
              <label>
                <span className="sr-only">Notes and links</span>
                <textarea
                  placeholder="Anything else your manager should know?"
                  value={form.notes}
                  onChange={(e) => field("notes", e.target.value)}
                />
              </label>
            </section>
            {message && <Alert>{message}</Alert>}
            <div className="form-actions">
              <p className="text-xs text-slate-400">
                {id
                  ? "Save your updates before resubmitting."
                  : "Your report will be saved as a draft."}
              </p>
              <div className="flex gap-2">
                <Link href="/dashboard" className="btn-secondary">
                  Cancel
                </Link>
                <button className="btn" disabled={!projects.length || saving}>
                  {saving ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {saving ? "Saving..." : id ? "Save Changes" : "Save as Draft"}
                </button>
              </div>
            </div>
          </fieldset>
        </form>
      )}
    </Shell>
  );
}
