"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

type DeleteTaskDialogProps = {
  taskId: string;
  taskTitle: string;
  onDeleted: () => void;
};

export default function DeleteTaskDialog({
  taskId,
  taskTitle,
  onDeleted,
}: DeleteTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete task"
        );
      }

      setOpen(false);

      onDeleted();
    } catch (error) {
      console.error("Delete task error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete task"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
        title="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Delete Task
                  </h2>

                  <p className="text-xs text-slate-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm leading-6 text-slate-400">
                Are you sure you want to delete this task?
              </p>

              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="truncate text-sm font-medium text-white">
                  {taskTitle}
                </p>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={deleting}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {deleting ? "Deleting..." : "Delete Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
