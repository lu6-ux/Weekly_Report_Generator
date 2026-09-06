"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  CalendarDays,
  LoaderCircle,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Project } from "@/lib/types";
import { Shell } from "@/components/Shell";
import { Alert, EmptyState, LoadingState } from "@/components/UI";
import Modal from "@/components/Modal";
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);
  useEffect(() => {
    api<{ projects: Project[] }>("/projects")
      .then((d) => setProjects(d.projects))
      .catch((e) => setMessage(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  function edit(project?: Project) {
    setId(project?.id || "");
    setName(project?.name || "");
    setDescription(project?.description || "");
    setModalError("");
    setEditing(true);
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setModalError("");
    try {
      const { project } = await api<{ project: Project }>(
        id ? `/projects/${id}` : "/projects",
        {
          method: id ? "PUT" : "POST",
          body: JSON.stringify({ name, description }),
        },
      );
      setProjects((old) =>
        (id
          ? old.map((p) => (p.id === id ? project : p))
          : [...old, project]
        ).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditing(false);
      setSuccess(
        id ? "Project updated successfully." : "Project created successfully.",
      );
    } catch (e) {
      setModalError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setModalError("");
    try {
      await api(`/projects/${deleting.id}`, { method: "DELETE" });
      setProjects((old) => old.filter((p) => p.id !== deleting.id));
      setDeleting(null);
      setSuccess("Project deleted successfully.");
    } catch (e) {
      setModalError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title="Projects"
      subtitle="Manage projects available for weekly reporting."
      managerOnly
      actions={
        <button className="btn" onClick={() => edit()}>
          <Plus size={16} />
          Add Project
        </button>
      }
    >
      {message && <Alert>{message}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      {loading ? (
        <LoadingState />
      ) : (
        <section className="table-panel">
          <div className="table-toolbar">
            <div>
              <h2>All Projects</h2>
              <p className="mt-1 text-xs text-slate-400">
                A shared home for your team&apos;s weekly work.
              </p>
            </div>
            <span className="badge badge-neutral">
              {projects.length} projects
            </span>
          </div>
          {projects.length ? (
            <div className="table-scroll">
              <table className="min-w-[650px]">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                            <FolderKanban size={17} />
                          </span>
                          <span className="max-w-52 font-semibold text-slate-700">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-sm whitespace-pre-wrap text-slate-500">
                        {p.description || "No description added"}
                      </td>
                      <td className="whitespace-nowrap text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          {p.createdAt
                            ? p.createdAt.slice(0, 10)
                            : "Not available"}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            className="text-button"
                            onClick={() => edit(p)}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            className="text-button text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setDeleting(p);
                              setModalError("");
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No projects yet"
              description="Create a project so your team can start organizing their weekly reports."
              icon={FolderKanban}
              action={
                <button className="btn" onClick={() => edit()}>
                  <Plus size={15} />
                  Add Project
                </button>
              }
            />
          )}
        </section>
      )}
      {editing && (
        <Modal
          title={id ? "Edit Project" : "Add Project"}
          description="Give your team a clear project name and a little context."
          onClose={() => setEditing(false)}
          busy={busy}
        >
          <form onSubmit={save} className="space-y-5">
            <label htmlFor="project-name">
              Project name
              <input
                autoFocus
                id="project-name"
                required
                maxLength={150}
                disabled={busy}
                placeholder="e.g. Customer Portal"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label htmlFor="project-description">
              Description (optional)
              <textarea
                id="project-description"
                disabled={busy}
                maxLength={5000}
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            {modalError && <Alert>{modalError}</Alert>}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button className="btn" disabled={busy}>
                {busy && <LoaderCircle size={15} className="animate-spin" />}
                {busy ? "Saving..." : id ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Delete project?"
          description={`Are you sure you want to delete ${deleting.name}? Projects with reports cannot be deleted.`}
          onClose={() => setDeleting(null)}
          busy={busy}
        >
          {modalError && <Alert>{modalError}</Alert>}
          <div className="mt-5 flex justify-end gap-2">
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            <button className="btn-danger" disabled={busy} onClick={remove}>
              <Trash2 size={14} />
              {busy ? "Deleting..." : "Delete Project"}
            </button>
          </div>
        </Modal>
      )}
    </Shell>
  );
}
