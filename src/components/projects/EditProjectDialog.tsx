"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";

type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
};

type EditProjectDialogProps = {
  project: Project;
  onUpdated: () => void;
};

const statuses: {
  value: ProjectStatus;
  label: string;
}[] = [
  {
    value: "PLANNING",
    label: "Planning",
  },
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "ON_HOLD",
    label: "On Hold",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "ARCHIVED",
    label: "Archived",
  },
];

export default function EditProjectDialog({
  project,
  onUpdated,
}: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(project.name);
  const [key, setKey] = useState(project.key);
  const [description, setDescription] = useState(
    project.description ?? ""
  );
  const [status, setStatus] =
    useState<ProjectStatus>(project.status);
  const [progress, setProgress] = useState(
    String(project.progress)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(project.name);
    setKey(project.key);
    setDescription(project.description ?? "");
    setStatus(project.status);
    setProgress(String(project.progress));
  }, [project]);

  function openModal() {
    setError("");

    setName(project.name);
    setKey(project.key);
    setDescription(project.description ?? "");
    setStatus(project.status);
    setProgress(String(project.progress));

    setOpen(true);
  }

  function closeModal() {
    if (loading) return;

    setOpen(false);
    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanKey = key.trim().toUpperCase();
    const cleanDescription = description.trim();
    const numericProgress = Number(progress);

    if (!cleanName) {
      setError("Project name is required.");
      return;
    }

    if (!/^[A-Z0-9_-]{2,10}$/.test(cleanKey)) {
      setError(
        "Project key must contain 2-10 uppercase letters, numbers, _ or -."
      );
      return;
    }

    if (
      !Number.isInteger(numericProgress) ||
      numericProgress < 0 ||
      numericProgress > 100
    ) {
      setError(
        "Progress must be an integer between 0 and 100."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${project.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: cleanName,
            key: cleanKey,
            description: cleanDescription,
            status,
            progress: numericProgress,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update project."
        );
      }

      setOpen(false);
      onUpdated();
    } catch (error) {
      console.error("Update project error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update project."
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
        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
      >
        <Pencil className="h-4 w-4" />
        Edit Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Project
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update project information.
                </p>
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

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="edit-project-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Project Name
                </label>

                <input
                  id="edit-project-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  disabled={loading}
                  className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-project-key"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Project Key
                </label>

                <input
                  id="edit-project-key"
                  type="text"
                  maxLength={10}
                  value={key}
                  onChange={(event) =>
                    setKey(
                      event.target.value
                        .toUpperCase()
                        .replace(
                          /[^A-Z0-9_-]/g,
                          ""
                        )
                    )
                  }
                  disabled={loading}
                  className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm uppercase text-white outline-none placeholder:text-slate-600 focus:border-slate-600 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-project-description"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Description
                </label>

                <textarea
                  id="edit-project-description"
                  rows={4}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  disabled={loading}
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600 disabled:opacity-50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-project-status"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Status
                  </label>

                  <select
                    id="edit-project-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target
                          .value as ProjectStatus
                      )
                    }
                    disabled={loading}
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-white outline-none focus:border-slate-600 disabled:opacity-50"
                  >
                    {statuses.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-project-progress"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Progress
                  </label>

                  <div className="relative">
                    <input
                      id="edit-project-progress"
                      type="number"
                      min={0}
                      max={100}
                      value={progress}
                      onChange={(event) =>
                        setProgress(event.target.value)
                      }
                      disabled={loading}
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 pr-12 text-sm text-white outline-none focus:border-slate-600 disabled:opacity-50"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-600">
                      %
                    </span>
                  </div>
                </div>
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
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {loading
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}