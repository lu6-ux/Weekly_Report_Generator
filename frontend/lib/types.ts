export const statuses = [
  "DRAFT",
  "SUBMITTED",
  "NEEDS_CORRECTION",
  "APPROVED",
] as const;
export const workTypes = [
  "DEVELOPMENT",
  "TESTING",
  "MEETING",
  "RESEARCH",
  "DOCUMENTATION",
  "OTHER",
] as const;
export type User = { id: string; name: string; email: string; role: string };
export type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
};
export type Task = {
  taskName: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  plannedPercent: number;
  actualPercent: number;
  plannedHours: number;
  actualHours: number;
  output: string;
};
export type ReportInput = {
  weekStart: string;
  weekEnd: string;
  projectId: string;
  nextWeekPlans: string;
  notes: string;
  tasks: Task[];
  blockers: { description: string }[];
  achievements: { description: string }[];
  workHours: {
    workType: (typeof workTypes)[number];
    hours: number;
    notes: string;
  }[];
};
export type Review = {
  id: string;
  comment: string;
  action: string;
  createdAt: string;
  reviewer: User;
  reportVersionId?: string | null;
};
export type Version = {
  id: string;
  versionNo: number;
  createdAt: string;
  snapshot: unknown;
  reviews: Review[];
};
export type Report = ReportInput & {
  id: string;
  userId: string;
  status: (typeof statuses)[number];
  user: User;
  project: Project;
  reviews: Review[];
  versions?: Version[];
};
export const label = (text: string) =>
  text
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const date = (text: string) => text.slice(0, 10);
export const actualHours = (report: Report) =>
  report.tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
export const emptyTask = (): Task => ({
  taskName: "",
  priority: "MEDIUM",
  status: "NOT_STARTED",
  plannedPercent: 0,
  actualPercent: 0,
  plannedHours: 0,
  actualHours: 0,
  output: "",
});
