"use client";

import { FormEvent, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Plus,
  X,
} from "lucide-react";

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

type Props = {
  projects: Project[];
  users: User[];
  onCreated: () => void;
};

export default function CreateSprintDialog({
  projects,
  users,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [projectId, setProjectId] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [status, setStatus] = useState<
    "PLANNED" | "ACTIVE" | "COMPLETED"
  >("PLANNED");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setName("");
    setGoal("");
    setProjectId("");
    setCreatorId("");
    setStatus("PLANNED");
    setStartDate("");
    setEndDate("");
    setError("");
  }

  function closeDialog() {
    if (loading) {
      return;
    }

    setOpen(false);
    resetForm();
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
      const response = await fetch("/api/sprints", {
        method: "POST",
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
            ? new Date(startDate).toISOString()
            : null,
          endDate: endDate
            ? new Date(endDate).toISOString()
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create sprint"
        );
      }

      setOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      console.error(
        "Create sprint error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create sprint"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
      >
        <Plus className="h-4 w-4" />
        Create Sprint
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Create Sprint
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Create a new sprint for your project.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
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
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
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
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
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
                  setProjectId(event.target.value)
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  Select project
                </option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.key} - {project.name}
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
                  setCreatorId(event.target.value)
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
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
                    event.target.value as
                      | "PLANNED"
                      | "ACTIVE"
                      | "COMPLETED"
                  )
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
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
                    setStartDate(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-500"
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
                    setEndDate(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-500"
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

              Create Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
