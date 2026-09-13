"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

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
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  project: Project;
  assignee: User | null;
  sprint: Sprint | null;
};

type EditTaskDialogProps = {
  task: Task;
  onUpdated: () => void;
};

export default function EditTaskDialog({
  task,
  onUpdated,
}: EditTaskDialogProps) {
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(
    task.description ?? ""
  );

  const [status, setStatus] = useState<TaskStatus>(
    task.status
  );

  const [priority, setPriority] = useState<Priority>(
    task.priority
  );

  const [projectId, setProjectId] = useState(
    task.project.id
  );

  const [assigneeId, setAssigneeId] = useState(
    task.assignee?.id ?? ""
  );

  const [sprintId, setSprintId] = useState(
    task.sprint?.id ?? ""
  );

  const [dueDate, setDueDate] = useState(
    task.dueDate
      ? new Date(task.dueDate).toISOString().slice(0, 10)
      : ""
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setProjectId(task.project.id);
    setAssigneeId(task.assignee?.id ?? "");
    setSprintId(task.sprint?.id ?? "");
    setDueDate(
      task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : ""
    );

    loadFormData(task.project.id);
  }, [open, task]);

  async function loadFormData(selectedProjectId: string) {
    try {
      setLoadingData(true);
      setError("");

      const [projectsResponse, usersResponse, projectResponse] =
        await Promise.all([
          fetch("/api/projects", {
            cache: "no-store",
          }),

          fetch("/api/users", {
            cache: "no-store",
          }),

          fetch(`/api/projects/${selectedProjectId}`, {
            cache: "no-store",
          }),
        ]);

      const projectsData = await projectsResponse.json();
      const usersData = await usersResponse.json();
      const projectData = await projectResponse.json();

      if (!projectsResponse.ok || !projectsData.success) {
        throw new Error(
          projectsData.message || "Failed to load projects"
        );
      }

      if (!usersResponse.ok || !usersData.success) {
        throw new Error(
          usersData.message || "Failed to load users"
        );
      }

      if (!projectResponse.ok || !projectData.success) {
        throw new Error(
          projectData.message || "Failed to load project"
        );
      }

      setProjects(projectsData.projects ?? []);
      setUsers(usersData.users ?? []);

      setSprints(projectData.project?.sprints ?? []);
    } catch (error) {
      console.error("Edit task form error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load form data"
      );
    } finally {
      setLoadingData(false);
    }
  }

  async function handleProjectChange(
    newProjectId: string
  ) {
    setProjectId(newProjectId);
    setSprintId("");

    try {
      const response = await fetch(
        `/api/projects/${newProjectId}`,
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

      setSprints(data.project?.sprints ?? []);
    } catch (error) {
      console.error("Sprint load error:", error);

      setSprints([]);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!projectId) {
      setError("Project is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",

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
          data.message || "Failed to update task"
        );
      }

      setOpen(false);

      onUpdated();
    } catch (error) {
      console.error("Update task error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update task"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-blue-400"
        title="Edit task"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Task
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update task information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

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
                  placeholder="Enter task title"
                  className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
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
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    disabled={loadingData}
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">
                      Select project
                    </option>

                    {projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.key} · {project.name}
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
                      setAssigneeId(event.target.value)
                    }
                    disabled={loadingData}
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
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
                      setStatus(
                        event.target.value as TaskStatus
                      )
                    }
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
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
                      setPriority(
                        event.target.value as Priority
                      )
                    }
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
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
                      setSprintId(event.target.value)
                    }
                    disabled={
                      loadingData || !projectId
                    }
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">
                      No Sprint
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

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(event.target.value)
                    }
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
