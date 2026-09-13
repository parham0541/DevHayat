"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CalendarDays,
  Edit3,
  Loader2,
  X,
} from "lucide-react";

type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

type Project = {
  id: string;
  name: string;
  key: string;
};

type User = {
  id: string;
  name: string;
  email: string;
};

type Sprint = {
  id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  project: Project;
  creator: User;
  startDate: string | null;
  endDate: string | null;
};

type Props = {
  sprint: Sprint;
  projects: Project[];
  users: User[];
  onUpdated: () => void;
};

function formatDateForInput(date: string | null) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    parsedDate.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function EditSprintDialog({
  sprint,
  projects,
  users,
  onUpdated,
}: Props) {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal ?? "");
  const [projectId, setProjectId] = useState(
    sprint.project.id
  );
  const [creatorId, setCreatorId] = useState(
    sprint.creator.id
  );
  const [status, setStatus] =
    useState<SprintStatus>(sprint.status);
  const [startDate, setStartDate] = useState(
    formatDateForInput(sprint.startDate)
  );
  const [endDate, setEndDate] = useState(
    formatDateForInput(sprint.endDate)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(sprint.name);
    setGoal(sprint.goal ?? "");
    setProjectId(sprint.project.id);
    setCreatorId(sprint.creator.id);
    setStatus(sprint.status);
    setStartDate(
      formatDateForInput(sprint.startDate)
    );
    setEndDate(
      formatDateForInput(sprint.endDate)
    );
    setError("");
  }, [open, sprint]);

  function closeDialog() {
    if (loading) {
      return;
    }

    setOpen(false);
    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Sprint name is required.");
      return;
    }

    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    if (!creatorId) {
      setError("Please select a creator.");
      return;
    }

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      setError(
        "Start date cannot be later than end date."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/sprints/${sprint.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            goal: goal.trim() || null,
            projectId,
            creatorId,
            status,
            startDate: startDate
              ? new Date(
                  `${startDate}T00:00:00`
                ).toISOString()
              : null,
            endDate: endDate
              ? new Date(
                  `${endDate}T23:59:59`
                ).toISOString()
              : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update sprint"
        );
      }

      setOpen(false);
      setError("");
      onUpdated();
    } catch (error) {
      console.error(
        "Update sprint error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update sprint"
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
        title="Edit sprint"
        aria-label="Edit sprint"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
      >
        <Edit3 className="h-4 w-4" />
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Sprint
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Update sprint information.
                </p>
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

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Sprint Name
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Example: Sprint 2"
                  maxLength={100}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Sprint Goal
                </label>

                <textarea
                  value={goal}
                  onChange={(event) =>
                    setGoal(event.target.value)
                  }
                  placeholder="What should this sprint accomplish?"
                  rows={3}
                  disabled={loading}
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Project
                  </label>

                  <select
                    value={projectId}
                    onChange={(event) =>
                      setProjectId(
                        event.target.value
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">
                      Select project
                    </option>

                    {projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.key} -{" "}
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Creator
                  </label>

                  <select
                    value={creatorId}
                    onChange={(event) =>
                      setCreatorId(
                        event.target.value
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">
                      Select creator
                    </option>

                    {users.map((user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value as SprintStatus
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="PLANNED">
                      Planned
                    </option>

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Start Date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) =>
                        setStartDate(
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    End Date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) =>
                        setEndDate(
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

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
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
