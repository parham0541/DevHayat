"use client";

import {
  CalendarDays,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

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
  status: string;
  projectId: string;
};

type CreateTaskDialogProps = {
  onCreated: () => void;
};

export default function CreateTaskDialog({
  onCreated,
}: CreateTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [projectsResponse, usersResponse] =
        await Promise.all([
          fetch("/api/projects", {
            cache: "no-store",
          }),
          fetch("/api/users", {
            cache: "no-store",
          }),
        ]);

      const projectsData = await projectsResponse.json();
      const usersData = await usersResponse.json();

      if (
        !projectsResponse.ok ||
        !projectsData.success
      ) {
        throw new Error(
          projectsData.message ||
            "Failed to load projects"
        );
      }

      if (!usersResponse.ok || !usersData.success) {
        throw new Error(
          usersData.message ||
            "Failed to load users"
        );
      }

      setProjects(projectsData.projects);
      setUsers(usersData.users);
    } catch (error) {
      console.error("Load create task data error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load form data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadSprints = async (selectedProjectId: string) => {
    if (!selectedProjectId) {
      setSprints([]);
      setSprintId("");
      return;
    }

    try {
      setSprints([]);
      setSprintId("");

      const response = await fetch(
        `/api/projects/${selectedProjectId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load project"
        );
      }

      setSprints(data.project.sprints || []);
    } catch (error) {
      console.error("Load sprints error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load sprints"
      );
    }
  };

  const handleOpen = async () => {
    setError("");
    setIsOpen(true);

    await loadData();
  };

  const handleClose = () => {
    if (isSubmitting) return;

    setIsOpen(false);
    setError("");
  };

  const handleProjectChange = async (
    value: string
  ) => {
    setProjectId(value);

    await loadSprints(value);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("MEDIUM");
    setProjectId("");
    setAssigneeId("");
    setSprintId("");
    setDueDate("");
    setSprints([]);
    setError("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          projectId,
          assigneeId: assigneeId || null,
          sprintId: sprintId || null,
          dueDate: dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create task"
        );
      }

      setIsOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      console.error("Create task error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create task"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!projectId) {
      setSprints([]);
      setSprintId("");
    }
  }, [projectId]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
      >
        <Plus className="h-4 w-4" />
        <span>New Task</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Create New Task
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a task to your project workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="text-sm text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Task Title
                    </label>

                    <input
                      type="text"
                      value={title}
                      onChange={(event) =>
                        setTitle(event.target.value)
                      }
                      placeholder="Enter task title..."
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Describe the task..."
                      rows={4}
                      className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Project
                      </label>

                      <select
                        value={projectId}
                        onChange={(event) =>
                          handleProjectChange(
                            event.target.value
                          )
                        }
                        className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-slate-600"
                      >
                        <option value="">
                          Select project
                        </option>

                        {projects.map((project) => (
                          <option
                            key={project.id}
                            value={project.id}
                          >
                            {project.key} — {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Assignee
                      </label>

                      <select
                        value={assigneeId}
                        onChange={(event) =>
                          setAssigneeId(
                            event.target.value
                          )
                        }
                        className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-slate-600"
                      >
                        <option value="">
                          Unassigned
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

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Status
                      </label>

                      <select
                        value={status}
                        onChange={(event) =>
                          setStatus(event.target.value)
                        }
                        className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-slate-600"
                      >
                        <option value="TODO">
                          To Do
                        </option>

                        <option value="IN_PROGRESS">
                          In Progress
                        </option>

                        <option value="COMPLETED">
                          Completed
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Priority
                      </label>

                      <select
                        value={priority}
                        onChange={(event) =>
                          setPriority(event.target.value)
                        }
                        className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-slate-600"
                      >
                        <option value="LOW">
                          Low
                        </option>

                        <option value="MEDIUM">
                          Medium
                        </option>

                        <option value="HIGH">
                          High
                        </option>

                        <option value="CRITICAL">
                          Critical
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Sprint
                      </label>

                      <select
                        value={sprintId}
                        onChange={(event) =>
                          setSprintId(
                            event.target.value
                          )
                        }
                        disabled={!projectId}
                        className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">
                          No sprint
                        </option>

                        {sprints.map((sprint) => (
                          <option
                            key={sprint.id}
                            value={sprint.id}
                          >
                            {sprint.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Due Date
                      </label>

                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                        <input
                          type="date"
                          value={dueDate}
                          onChange={(event) =>
                            setDueDate(
                              event.target.value
                            )
                          }
                          className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-3 text-sm text-white outline-none transition focus:border-slate-600"
                        />
                      </div>
                    </div>

                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isLoading ||
                    !title.trim() ||
                    !projectId
                  }
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Task
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}