"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FolderKanban,
  Loader2,
  Users,
  ListTodo,
  Bug,
  Target,
} from "lucide-react";

import EditProjectDialog from "@/components/projects/EditProjectDialog";
import DeleteProjectDialog from "@/components/projects/DeleteProjectDialog";
import AddProjectMemberDialog from "@/components/projects/AddProjectMemberDialog";
import RemoveProjectMemberDialog from "@/components/projects/RemoveProjectMemberDialog";

type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type ProjectMember = {
  id: string;
  userId: string;
  projectId: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  members: ProjectMember[];
  _count: {
    tasks: number;
    issues: number;
    sprints?: number;
  };
};

const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    className: string;
  }
> = {
  PLANNING: {
    label: "Planning",
    className:
      "border-slate-700 bg-slate-800 text-slate-300",
  },

  ACTIVE: {
    label: "Active",
    className:
      "border-emerald-900/50 bg-emerald-950/30 text-emerald-400",
  },

  ON_HOLD: {
    label: "On Hold",
    className:
      "border-amber-900/50 bg-amber-950/30 text-amber-400",
  },

  COMPLETED: {
    label: "Completed",
    className:
      "border-blue-900/50 bg-blue-950/30 text-blue-400",
  },

  ARCHIVED: {
    label: "Archived",
    className:
      "border-slate-700 bg-slate-900 text-slate-500",
  },
};

function getStatusIcon(status: ProjectStatus) {
  if (status === "COMPLETED") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (status === "ACTIVE") {
    return <Clock3 className="h-4 w-4" />;
  }

  return <Circle className="h-4 w-4" />;
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(
    null
  );

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] =
    useState(true);
  const [loadingMembers, setLoadingMembers] =
    useState(false);

  const [error, setError] = useState("");

  const loadCurrentUser = useCallback(async () => {
    try {
      setLoadingUser(true);

      const response = await fetch(
        "/api/auth/me",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.authenticated) {
        setCurrentUser(null);
        return;
      }

      setCurrentUser(data.user);
    } catch (error) {
      console.error(
        "Current user error:",
        error
      );

      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoadingMembers(true);

      const response = await fetch(
        `/api/projects/${projectId}/members`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load project members."
        );
      }

      setProject((currentProject) => {
        if (!currentProject) {
          return currentProject;
        }

        return {
          ...currentProject,
          members: data.members ?? [],
        };
      });
    } catch (error) {
      console.error(
        "Project members error:",
        error
      );
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId]);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/projects/${projectId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.project
      ) {
        throw new Error(
          data.message || "Project not found"
        );
      }

      setProject(data.project);
    } catch (error) {
      console.error(
        "Project details error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load project."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadCurrentUser();
    loadProject();
  }, [
    loadCurrentUser,
    loadProject,
  ]);

  useEffect(() => {
    if (project) {
      loadMembers();
    }
  }, [
    projectId,
    project?.id,
    loadMembers,
  ]);

  if (loading || loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading project...
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="p-6 lg:p-8">
          <Link
            href="/projects"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>

          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-8">
            <h1 className="text-lg font-semibold text-red-400">
              Project not found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error ||
                "The requested project could not be found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[project.status];

  const canManageMembers =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "PROJECT_MANAGER";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold">
                  {project.key.slice(0, 3)}
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                      {project.name}
                    </h1>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
                    >
                      {getStatusIcon(project.status)}
                      {status.label}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500">
                    Project key:{" "}
                    <span className="font-medium text-slate-300">
                      {project.key}
                    </span>
                  </p>

                  <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                    {project.description ||
                      "No description provided for this project."}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <EditProjectDialog
                  project={project}
                  onUpdated={loadProject}
                />

                <DeleteProjectDialog
                  projectId={project.id}
                  projectName={project.name}
                  onDeleted={() =>
                    router.push("/projects")
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800">
            <div className="grid grid-cols-2 divide-x divide-slate-800 lg:grid-cols-4">
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Target className="h-4 w-4" />
                  Progress
                </div>

                <p className="mt-2 text-2xl font-bold">
                  {project.progress}%
                </p>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ListTodo className="h-4 w-4" />
                  Tasks
                </div>

                <p className="mt-2 text-2xl font-bold">
                  {project._count.tasks}
                </p>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Bug className="h-4 w-4" />
                  Issues
                </div>

                <p className="mt-2 text-2xl font-bold">
                  {project._count.issues}
                </p>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="h-4 w-4" />
                  Members
                </div>

                <p className="mt-2 text-2xl font-bold">
                  {project.members.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Project Progress
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Current project completion
                  </p>
                </div>

                <span className="text-sm font-semibold text-slate-300">
                  {project.progress}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(project.progress, 0),
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-600">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6">
                <h2 className="font-semibold">
                  Project Information
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  General information about this project
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">
                    Project Name
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {project.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Project Key
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {project.key}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {status.label}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {formatDate(project.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {formatDate(project.updatedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Owner
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {project.owner.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">
                    Project Members
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    People working on this project
                  </p>
                </div>

                {canManageMembers && (
                  <AddProjectMemberDialog
                    projectId={project.id}
                    currentMemberIds={project.members.map(
                      (member) => member.userId
                    )}
                    onAdded={loadMembers}
                  />
                )}
              </div>

              {loadingMembers ? (
                <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 p-8">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading members...
                  </div>
                </div>
              ) : project.members.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950 p-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-700" />

                  <p className="mt-3 text-sm text-slate-400">
                    No members found.
                  </p>

                  {canManageMembers && (
                    <p className="mt-1 text-xs text-slate-600">
                      Add a member to start building your
                      project team.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {project.members.map((member) => {
                    const isOwner =
                      member.userId === project.owner.id;

                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-300">
                            {getInitials(
                              member.user.name
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-slate-200">
                                {member.user.name}
                              </p>

                              {isOwner && (
                                <span className="rounded-full border border-violet-900/40 bg-violet-950/30 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                                  Owner
                                </span>
                              )}
                            </div>

                            <p className="truncate text-xs text-slate-500">
                              {member.user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-fit rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
                            {formatRole(
                              member.user.role
                            )}
                          </span>

                          {canManageMembers &&
                            !isOwner && (
                              <RemoveProjectMemberDialog
                                projectId={project.id}
                                userId={member.userId}
                                userName={
                                  member.user.name
                                }
                                onRemoved={
                                  loadMembers
                                }
                              />
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                  <FolderKanban className="h-5 w-5 text-slate-400" />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Project
                  </h2>

                  <p className="text-xs text-slate-500">
                    {project.key}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Status
                  </span>

                  <span className="text-sm text-slate-300">
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Progress
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    {project.progress}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Members
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    {project.members.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Tasks
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    {project._count.tasks}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Issues
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    {project._count.issues}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Sprints
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    {project._count.sprints ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-5 flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-slate-500" />

                <div>
                  <h2 className="font-semibold">
                    Timeline
                  </h2>

                  <p className="text-xs text-slate-500">
                    Project dates
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-slate-500" />

                  <div>
                    <p className="text-xs text-slate-500">
                      Created
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {formatDate(
                        project.createdAt
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-white" />

                  <div>
                    <p className="text-xs text-slate-500">
                      Last updated
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {formatDate(
                        project.updatedAt
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-500" />

                <h2 className="font-semibold">
                  Owner
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 font-semibold">
                  {getInitials(
                    project.owner.name
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200">
                    {project.owner.name}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {project.owner.email}
                  </p>

                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-violet-400/80">
                    {formatRole(
                      project.owner.role
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}