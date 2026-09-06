"use client";
import { FormEvent, useState } from "react";
import { Check, MessageSquareText, LoaderCircle } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Report } from "@/lib/types";
import Modal from "./Modal";
import { Alert } from "./UI";
export type ReviewSelection = {
  report: Report;
  action: "approve" | "request-correction";
};
export default function ReviewModal({
  selection,
  onClose,
  onReviewed,
}: {
  selection: ReviewSelection;
  onClose: () => void;
  onReviewed: (report: Report) => void;
}) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const correction = selection.action === "request-correction";
  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (correction && !comment.trim()) {
      setMessage("Please explain what needs to be corrected.");
      return;
    }
    setBusy(true);
    try {
      const { report } = await api<{ report: Report }>(
        `/reports/${selection.report.id}/${selection.action}`,
        { method: "PATCH", body: JSON.stringify({ comment }) },
      );
      onReviewed(report);
      onClose();
    } catch (error) {
      setMessage(errorMessage(error));
      setBusy(false);
    }
  }
  return (
    <Modal
      title={correction ? "Request Changes" : "Approve this weekly report?"}
      description={
        correction
          ? "Explain what should be corrected before the report is resubmitted."
          : "Confirm that this report is ready to be approved. You can include a note for the team member."
      }
      onClose={onClose}
      busy={busy}
    >
      <div className="mb-5 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="text-sm font-semibold">{selection.report.project.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {selection.report.user.name} &middot; Week of{" "}
          {selection.report.weekStart.slice(0, 10)}
        </p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <label htmlFor="review-comment">
          {correction ? "Feedback / Comment" : "Manager comment (optional)"}
          <textarea
            autoFocus
            id="review-comment"
            required={correction}
            disabled={busy}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              correction
                ? "Describe the changes needed..."
                : "Add a note of feedback or encouragement..."
            }
            className="min-h-32"
          />
        </label>
        {message && <Alert>{message}</Alert>}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn" disabled={busy}>
            {busy ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : correction ? (
              <MessageSquareText size={16} />
            ) : (
              <Check size={16} />
            )}
            {busy
              ? "Saving..."
              : correction
                ? "Request Changes"
                : "Approve Report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
