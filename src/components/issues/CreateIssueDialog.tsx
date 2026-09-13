"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

type Project = {
  id: string;
  name: string;
  key: string;
  ownerId?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type ProjectMember = {
  id: string;
  userId: string;
  user: User;
};

type CreateIssueDialogProps = {
  onCreated: () => void;
};

export default function CreateIssueDialog({
  onCreated,
}: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("TASK");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("TODO");
  const [projectId, setProjectId] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  async function loadFormData() {
    try {
      setLoadingData(true);
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

      if (!projectsResponse.ok || !projectsData.success) {
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

      const loadedProjects =
        projectsData.projects || [];

      const loadedUsers =
        usersData.users || [];

      setProjects(loadedProjects);
      setUsers(loadedUsers);

      if (!projectId && loadedProjects.length) {
        setProjectId(loadedProjects[0].id);
      }

      if (!reporterId && loadedUsers.length) {
        setReporterId(loadedUsers[0].id);
      }
    } catch (error) {
      console.error(
        "Create issue data error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load form data"
      );
    } finally {
      setLoadingData(false);
    }
  }

  async function loadProjectMembers(
    selectedProjectId: string
  ) {
    if (!selectedProjectId) {
      setProjectMembers([]);
      return;
    }

    try {
      setLoadingMembers(true);
      setError("");
      setAssigneeId("");

      const response = await fetch(
        `/api/projects/${selectedProjectId}/members`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load project members"
        );
      }

      const members = data.members || [];

      const memberUsers: User[] = members
        .map((member: ProjectMember) => {
          if (member.user) {
            return member.user;
          }

          return null;
        })
        .filter(
          (user: User | null): user is User =>
            user !== null
        );

      setProjectMembers(memberUsers);
    } catch (error) {
      console.error(
        "Load project members error:",
        error
      );

      setProjectMembers([]);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load project members"
      );
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  useEffect(() => {
    if (open && projectId) {
      loadProjectMembers(projectId);
    }
  }, [open, projectId]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("TASK");
    setPriority("MEDIUM");
    setStatus("TODO");
    setProjectId("");
    setReporterId("");
    setAssigneeId("");
    setProjectMembers([]);
    setError("");
  }

  function closeDialog() {
    if (submitting) return;

    setOpen(false);
    resetForm();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!title.trim()) {
        setError("Issue title is required.");
        return;
      }

      if (!projectId) {
        setError("Please select a project.");
        return;
      }

      if (!reporterId) {
        setError("Please select a reporter.");
        return;
      }

      if (
        assigneeId &&
        !projectMembers.some(
          (member) => member.id === assigneeId
        )
      ) {
        const message =
          "The selected user is not a member of this project and cannot be assigned to this issue. Please add the user to the project first.";

        setError(message);
        alert(message);

        return;
      }

      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          priority,
          status,
          projectId,
          reporterId,
          assigneeId: assigneeId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message =
          data.message ||
          "Failed to create issue";

        if (
          message.toLowerCase().includes(
            "assignee"
          ) &&
          message.toLowerCase().includes(
            "project"
          )
        ) {
          const alertMessage =
            "The selected user is not a member of this project and cannot be assigned to this issue. Please add the user to the project first.";

          setError(alertMessage);
          alert(alertMessage);

          return;
        }

        throw new Error(message);
      }

      setOpen(false);
      resetForm();

      onCreated();
    } catch (error) {
      console.error(
        "Create issue error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create issue";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
      >
        <Plus className="h-4 w-4" />
        Create Issue
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Create Issue
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create a new issue for your project.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {loadingData ? (
                  <div className="flex min-h-60 items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading project data...
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Title
                      </label>

                      <input
                        value={title}
                        onChange={(event) =>
                          setTitle(event.target.value)
                        }
                        placeholder="Enter issue title"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Description
                      </label>

                      <textarea
                        value={description}
                        onChange={(event) =>
                          setDescription(
                            event.target.value
                          )
                        }
                        placeholder="Describe the issue..."
                        rows={4}
                        className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Type
                        </label>

                        <select
                          value={type}
                          onChange={(event) =>
                            setType(
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
                        >
                          <option value="TASK">
                            Task
                          </option>

                          <option value="BUG">
                            Bug
                          </option>

                          <option value="STORY">
                            Story
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
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
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
                          Status
                        </label>

                        <select
                          value={status}
                          onChange={(event) =>
                            setStatus(
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
                        >
                          <option value="TODO">
                            To Do
                          </option>

                          <option value="IN_PROGRESS">
                            In Progress
                          </option>

                          <option value="DONE">
                            Done
                          </option>
                        </select>
                      </div>
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
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
                        >
                          <option value="">
                            Select project
                          </option>

                          {projects.map(
                            (project) => (
                              <option
                                key={project.id}
                                value={project.id}
                              >
                                {project.name} (
                                {project.key})
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Reporter
                        </label>

                        <select
                          value={reporterId}
                          onChange={(event) =>
                            setReporterId(
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
                        >
                          <option value="">
                            Select reporter
                          </option>

                          {users.map((user) => (
                            <option
                              key={user.id}
                              value={user.id}
                            >
                              {user.name} -{" "}
                              {user.role}
                            </option>
                          ))}
                        </select>
                      </div>
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
                        disabled={
                          loadingMembers ||
                          !projectId
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {loadingMembers
                            ? "Loading project members..."
                            : !projectId
                              ? "Select a project first"
                              : "Unassigned"}
                        </option>

                        {projectMembers.map(
                          (user) => (
                            <option
                              key={user.id}
                              value={user.id}
                            >
                              {user.name} -{" "}
                              {user.role}
                            </option>
                          )
                        )}
                      </select>

                      {!loadingMembers &&
                        projectId &&
                        projectMembers.length ===
                          0 && (
                          <p className="mt-2 text-xs text-amber-400">
                            No members are available
                            for this project.
                          </p>
                        )}

                      {projectId &&
                        !loadingMembers && (
                          <p className="mt-2 text-xs text-slate-500">
                            Only users who are members
                            of the selected project
                            can be assigned to this
                            issue.
                          </p>
                        )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={submitting}
                  className="rounded-lg border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    loadingData ||
                    loadingMembers ||
                    !title.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {submitting
                    ? "Creating..."
                    : "Create Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

