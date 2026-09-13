"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

type DeleteProjectDialogProps = {
  projectId: string;
  projectName: string;
  onDeleted: () => void;
};

export default function DeleteProjectDialog({
  projectId,
  projectName,
  onDeleted,
}: DeleteProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openModal() {
    setError("");
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;

    setOpen(false);
    setError("");
  }

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete project."
        );
      }

      setOpen(false);
      onDeleted();
    } catch (error) {
      console.error("Delete project error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete project."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-800 hover:bg-red-950/40 hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" />
        Delete Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/40">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Delete Project
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {error && (
                <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <p className="text-sm leading-6 text-slate-300">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white">
                  {projectName}
                </span>
                ?
              </p>

              <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm leading-6 text-red-300">
                All project data including tasks, issues,
                sprints, and members will be permanently deleted.
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-lg border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {loading ? "Deleting..." : "Delete Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}