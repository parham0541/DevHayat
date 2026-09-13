"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

type RemoveProjectMemberDialogProps = {
  projectId: string;
  userId: string;
  userName: string;
  onRemoved: () => void;
};

export default function RemoveProjectMemberDialog({
  projectId,
  userId,
  userName,
  onRemoved,
}: RemoveProjectMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  function handleOpen() {
    setError("");
    setOpen(true);
  }

  function handleClose() {
    if (removing) return;

    setOpen(false);
    setError("");
  }

  async function handleRemove() {
    try {
      setRemoving(true);
      setError("");

      const response = await fetch(
        `/api/projects/${projectId}/members/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to remove project member."
        );
      }

      setOpen(false);

      onRemoved();
    } catch (error) {
      console.error(
        "Remove project member error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to remove project member."
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:border-red-800/60 hover:bg-red-950/40 hover:text-red-300"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-white">
                    Remove Member
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={removing}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm leading-6 text-slate-400">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-white">
                  {userName}
                </span>{" "}
                from this project?
              </p>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs leading-5 text-red-400">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={removing}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remove Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

