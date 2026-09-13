"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

type Props = {
  sprintId: string;
  sprintName: string;
  taskCount: number;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  onDeleted: () => void;
};

export default function DeleteSprintDialog({
  sprintId,
  sprintName,
  taskCount,
  status,
  onDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDelete =
    status !== "ACTIVE" && taskCount === 0;

  function closeDialog() {
    if (loading) {
      return;
    }

    setOpen(false);
    setError("");
  }

  async function handleDelete() {
    if (!canDelete) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/sprints/${sprintId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete sprint"
        );
      }

      setOpen(false);
      setError("");
      onDeleted();
    } catch (error) {
      console.error(
        "Delete sprint error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete sprint"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Delete sprint"
        aria-label="Delete sprint"
        className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Delete Sprint
                  </h2>

                  <p className="text-sm text-slate-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={loading}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">
                  You are about to delete:
                </p>

                <p className="mt-1 break-words text-base font-semibold text-white">
                  {sprintName}
                </p>
              </div>

              {!canDelete && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium text-amber-300">
                    This sprint cannot be deleted.
                  </p>

                  <ul className="mt-2 space-y-1 text-xs text-amber-200/70">
                    {status === "ACTIVE" && (
                      <li>
                        • Active sprints cannot be
                        deleted.
                      </li>
                    )}

                    {taskCount > 0 && (
                      <li>
                        • This sprint contains{" "}
                        {taskCount} task
                        {taskCount === 1
                          ? ""
                          : "s"}
                        .
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-950/40 px-3 py-2.5 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={loading}
                  className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={
                    loading || !canDelete
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}

                  Delete Sprint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
