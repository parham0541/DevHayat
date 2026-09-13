"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

type DeleteIssueDialogProps = {
  issueId: string;
  issueTitle: string;
  onDeleted: () => void;
};

export default function DeleteIssueDialog({
  issueId,
  issueTitle,
  onDeleted,
}: DeleteIssueDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleOpen = () => {
    setError("");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isDeleting) return;

    setIsOpen(false);
    setError("");
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError("");

      const response = await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete issue");
      }

      setIsOpen(false);
      setError("");

      onDeleted();
    } catch (error) {
      console.error("Delete issue error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete issue. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Delete issue"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300"
      >
        <Trash2 size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111318] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Delete Issue
                  </h2>

                  <p className="text-sm text-gray-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-300">
                Are you sure you want to permanently delete this issue?
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Issue
                </p>

                <p className="break-words text-sm font-medium text-white">
                  {issueTitle}
                </p>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="text-sm leading-5 text-red-300">{error}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Issue
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