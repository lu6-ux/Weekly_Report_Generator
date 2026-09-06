"use client";
import { Fragment } from "react";
import Link from "next/link";
import {
  Eye,
  Pencil,
  Send,
  Check,
  MessageSquareText,
  CalendarDays,
} from "lucide-react";
import { Report, actualHours, date } from "@/lib/types";
import { Avatar, Progress, StatusBadge } from "./UI";
export const reportProgress = (report: Report) =>
  report.tasks.length
    ? report.tasks.reduce((sum, task) => sum + task.actualPercent, 0) /
      report.tasks.length
    : 0;
export default function ReportTable({
  reports,
  manager = false,
  busy = "",
  onSubmit,
  onReview,
}: {
  reports: Report[];
  manager?: boolean;
  busy?: string;
  onSubmit?: (id: string) => void;
  onReview?: (report: Report, action: "approve" | "request-correction") => void;
}) {
  return (
    <div className="table-scroll">
      <table className={manager ? "min-w-[1020px]" : "min-w-[890px]"}>
        <thead>
          <tr>
            {manager && <th>Employee</th>}
            <th>Week</th>
            <th>Project</th>
            <th>Tasks</th>
            <th>Progress</th>
            <th>{manager ? "Hours" : "Actual hours"}</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <Fragment key={r.id}>
              <tr>
                {manager && (
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.user.name} small />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {r.user.name}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {r.user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                )}
                <td className="whitespace-nowrap">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <CalendarDays size={14} className="text-slate-400" />
                    {date(r.weekStart)}
                  </div>
                  <p className="ml-[22px] mt-1 text-[10px] text-slate-400">
                    to {date(r.weekEnd)}
                  </p>
                </td>
                <td>
                  <p className="max-w-40 font-semibold text-slate-700">
                    {r.project.name}
                  </p>
                  {!manager && (
                    <details className="mt-1 text-[10px] text-slate-400">
                      <summary>Next week plans</summary>
                      <p className="mt-2 max-w-48 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                        {r.nextWeekPlans || "No plans added."}
                      </p>
                    </details>
                  )}
                </td>
                <td className="whitespace-nowrap">
                  <span className="font-semibold text-slate-700">
                    {r.tasks.filter((t) => t.status === "COMPLETED").length}
                  </span>
                  <span className="text-slate-400"> / {r.tasks.length}</span>
                  <p className="mt-1 text-[10px] text-slate-400">completed</p>
                </td>
                <td>
                  <Progress value={reportProgress(r)} />
                </td>
                <td className="whitespace-nowrap font-medium tabular-nums">
                  {actualHours(r).toLocaleString()}{" "}
                  <span className="font-normal text-slate-400">hrs</span>
                </td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/reports/${r.id}`}
                      className="text-button"
                      title="View report"
                    >
                      <Eye size={14} />
                      View
                    </Link>
                    {!manager &&
                      ["DRAFT", "NEEDS_CORRECTION"].includes(r.status) && (
                        <>
                          <Link
                            href={`/reports/${r.id}/edit`}
                            className="text-button"
                            title="Edit report"
                          >
                            <Pencil size={13} />
                            Edit
                          </Link>
                          <button
                            className="text-button"
                            disabled={!!busy}
                            onClick={() => onSubmit?.(r.id)}
                          >
                            <Send size={13} />
                            {busy === r.id
                              ? "Submitting..."
                              : r.status === "NEEDS_CORRECTION"
                                ? "Resubmit"
                                : "Submit"}
                          </button>
                        </>
                      )}
                    {manager && r.status === "SUBMITTED" && (
                      <>
                        <button
                          className="text-button text-emerald-700"
                          disabled={!!busy}
                          onClick={() => onReview?.(r, "approve")}
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          className="text-button text-amber-700"
                          disabled={!!busy}
                          onClick={() => onReview?.(r, "request-correction")}
                        >
                          <MessageSquareText size={14} />
                          Request Changes
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
              {!manager && r.status === "NEEDS_CORRECTION" && (
                <tr>
                  <td colSpan={7} className="!bg-amber-50/60 !py-3">
                    <div className="flex items-start gap-2 text-xs text-amber-800">
                      <MessageSquareText
                        size={15}
                        className="mt-0.5 shrink-0"
                      />
                      <div>
                        <span className="font-semibold">
                          Changes requested:{" "}
                        </span>
                        <span className="whitespace-pre-wrap">
                          {r.reviews.find(
                            (v) => v.action === "NEEDS_CORRECTION",
                          )?.comment ||
                            "Please contact your manager for details."}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
