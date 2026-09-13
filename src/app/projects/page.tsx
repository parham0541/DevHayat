"use client";

import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Search,
  Users,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  CircleAlert,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER"
  | "DESIGNER"
  | "MEMBER";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;

  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
  };

  members: {
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
  }[];

  _count: {
    tasks: number;
    issues: number;
  };
};

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

function getStatusIcon(status: ProjectStatus) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="h-4 w-4" />;

    case "ACTIVE":
      return <Clock3 className="h-4 w-4" />;

    case "ON_HOLD":
      return <CircleAlert className="h-4 w-4" />;

    default:
      return <Circle className="h-4 w-4" />;
  }
}

function getStatusClass(status: ProjectStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-blue-400/20 bg-blue-400/10 text-blue-400";

    case "COMPLETED":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";

    case "ON_HOLD":
      return "border-amber-400/20 bg-amber-400/10 text-amber-400";

    case "PLANNING":
      return "border-violet-400/20 bg-violet-400/10 text-violet-400";

    case "ARCHIVED":
      return "border-slate-700 bg-slate-800/60 text-slate-500";

    default:
      return "border-slate-700 bg-slate-800/60 text-slate-400";
  }
}

function getProjectGradient(index: number) {
  const gradients = [
    "from-violet-500 via-purple-500 to-fuchsia-500",
    "from-blue-500 via-cyan-500 to-teal-400",
    "from-emerald-500 via-teal-500 to-cyan-400",
    "from-orange-500 via-amber-500 to-yellow-400",
    "from-pink-500 via-rose-500 to-red-400",
  ];

  return gradients[index % gradients.length];
}

function formatRole(role: UserRole) {
  switch (role) {
    case "PROJECT_MANAGER":
      return "Project Manager";

    case "ADMIN":
      return "Administrator";

    case "DEVELOPER":
      return "Developer";

    case "DESIGNER":
      return "Designer";

    default:
      return "Member";
  }
}

export default function ProjectsPage() {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Load current user
   */

  const loadUser = useCallback(async () => {
    try {
      setLoadingUser(true);

      const response = await fetch(
        "/api/auth/me",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.user
      ) {
        window.location.replace("/login");
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error(
        "Authentication error:",
        error
      );

      window.location.replace("/login");
    } finally {
      setLoadingUser(false);
    }
  }, []);

  /*
   * Load projects
   */

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/projects",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch projects"
        );
      }

      setProjects(data.projects ?? []);
    } catch (error) {
      console.error(
        "Load projects error:",
        error
      );

      setError(
        "Unable to load your projects."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Authentication
   */

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /*
   * Projects after authentication
   */

  useEffect(() => {
    if (!loadingUser && user) {
      loadProjects();
    }
  }, [
    loadingUser,
    user,
    loadProjects,
  ]);

  /*
   * Search
   */

  const filteredProjects = useMemo(() => {
    const query = search
      .toLowerCase()
      .trim();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const searchableText = [
        project.name,
        project.key,
        project.description ?? "",
        project.owner.name,
        statusLabels[project.status],
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [projects, search]);

  /*
   * Statistics
   */

  const projectStats = useMemo(() => {
    return {
      total: projects.length,

      active: projects.filter(
        (project) =>
          project.status === "ACTIVE"
      ).length,

      completed: projects.filter(
        (project) =>
          project.status === "COMPLETED"
      ).length,

      onHold: projects.filter(
        (project) =>
          project.status === "ON_HOLD"
      ).length,
    };
  }, [projects]);

  const canCreateProject =
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER";

  /*
   * Initial loading
   */

  if (loadingUser) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] text-white">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />

        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="flex items-center gap-3 text-sm text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin text-violet-400" />

          Loading workspace...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <Link
          href="/login"
          className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-600"
        >
          Go to Login
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      {/* Background */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-violet-600/15 blur-[150px]" />

        <div className="absolute -right-48 top-[-100px] h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[150px]" />

        <div className="absolute bottom-[-250px] left-[35%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: "42px 42px",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,8,22,0.5)_70%,rgba(5,8,22,0.95)_100%)]" />
      </div>

      {/* Content */}

      <div className="relative z-10 p-5 sm:p-6 lg:p-8">
        {/* Header */}

        <header className="mb-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                <FolderKanban className="h-4 w-4 text-violet-400" />

                <span>Workspace</span>

                <span className="text-slate-700">
                  /
                </span>

                <span className="text-slate-400">
                  Projects
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Projects
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Manage your projects, tasks and
                team activity from one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadProjects}
                disabled={loading}
                className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-400 backdrop-blur-xl transition hover:border-slate-700 hover:bg-slate-800/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading
                      ? "animate-spin"
                      : "transition-transform duration-500 group-hover:rotate-180"
                  }`}
                />

                Refresh
              </button>

              {canCreateProject && (
                <CreateProjectDialog
                  onCreated={loadProjects}
                />
              )}
            </div>
          </div>
        </header>

        {/* Stats */}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Total Projects
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {projectStats.total}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
                <FolderKanban className="h-4 w-4 text-violet-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Active
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {projectStats.active}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10">
                <Clock3 className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Completed
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {projectStats.completed}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  On Hold
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {projectStats.onHold}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10">
                <CircleAlert className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Search */}

        <section className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/45 p-4 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="text"
                placeholder="Search by project name, key, owner or status..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/5"
              />
            </div>

            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-600">
                Showing
              </span>

              <span className="font-semibold text-slate-300">
                {filteredProjects.length}
              </span>

              <span className="text-slate-600">
                of
              </span>

              <span className="font-semibold text-slate-300">
                {projects.length}
              </span>

              <span className="text-slate-600">
                projects
              </span>
            </div>
          </div>
        </section>

        {/* Loading */}

        {loading && (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/55">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/5">
                <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-300">
                  Loading projects
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Fetching your workspace data...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/10 bg-rose-500/10">
                  <CircleAlert className="h-4 w-4 text-rose-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-rose-300">
                    Unable to load projects
                  </p>

                  <p className="mt-1 text-xs text-rose-400/70">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadProjects}
                className="rounded-lg border border-rose-400/20 px-4 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}

        {!loading &&
          !error &&
          filteredProjects.length === 0 && (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/55 p-8">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
                  {projects.length === 0 ? (
                    <FolderKanban className="h-7 w-7 text-slate-600" />
                  ) : (
                    <Search className="h-7 w-7 text-slate-600" />
                  )}
                </div>

                <h2 className="mt-5 text-lg font-semibold">
                  {projects.length === 0
                    ? "No projects yet"
                    : "No projects found"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {projects.length === 0
                    ? canCreateProject
                      ? "Create your first project and start managing your work."
                      : "You are not a member of any project yet."
                    : "Try changing your search query."}
                </p>

                {projects.length === 0 &&
                  canCreateProject && (
                    <div className="mt-5">
                      <CreateProjectDialog
                        onCreated={loadProjects}
                      />
                    </div>
                  )}

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 text-xs font-medium text-violet-400 hover:text-violet-300"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          )}

        {/* Projects */}

        {!loading &&
          !error &&
          filteredProjects.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <Layers3 className="h-4 w-4 text-violet-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Your Projects
                    </h2>

                    <p className="text-[11px] text-slate-600">
                      Workspace projects you can access
                    </p>
                  </div>
                </div>

                {user && (
                  <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 sm:flex">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />

                    <span className="text-[10px] text-slate-500">
                      {formatRole(user.role)}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map(
                  (project, index) => {
                    const progress = Math.min(
                      Math.max(
                        project.progress,
                        0
                      ),
                      100
                    );

                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="group relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/55 p-5 shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/75"
                      >
                        {/* Card glow */}

                        <div
                          className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br ${getProjectGradient(
                            index
                          )} opacity-0 blur-[70px] transition-opacity duration-500 group-hover:opacity-10`}
                        />

                        {/* Header */}

                        <div className="relative flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getProjectGradient(
                                index
                              )} p-[1px]`}
                            >
                              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-slate-950 text-xs font-bold text-slate-200">
                                {project.key.slice(
                                  0,
                                  3
                                )}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <h2 className="truncate text-sm font-semibold text-slate-200 transition group-hover:text-white">
                                {project.name}
                              </h2>

                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                {project.key}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-medium ${getStatusClass(
                              project.status
                            )}`}
                          >
                            {getStatusIcon(
                              project.status
                            )}

                            <span>
                              {
                                statusLabels[
                                  project.status
                                ]
                              }
                            </span>
                          </div>
                        </div>

                        {/* Description */}

                        <p className="relative mt-5 min-h-[40px] text-xs leading-5 text-slate-500">
                          {project.description ||
                            "No description provided."}
                        </p>

                        {/* Progress */}

                        <div className="relative mt-5">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                              Progress
                            </span>

                            <span className="text-xs font-bold text-slate-300">
                              {progress}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${getProjectGradient(
                                index
                              )} transition-all duration-700`}
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Counters */}

                        <div className="relative mt-5 grid grid-cols-3 gap-2">
                          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                            <p className="text-[10px] text-slate-600">
                              Tasks
                            </p>

                            <p className="mt-1 text-lg font-bold text-slate-200">
                              {project._count.tasks}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                            <p className="text-[10px] text-slate-600">
                              Issues
                            </p>

                            <p className="mt-1 text-lg font-bold text-slate-200">
                              {project._count.issues}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                            <p className="text-[10px] text-slate-600">
                              Members
                            </p>

                            <div className="mt-1 flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-slate-600" />

                              <span className="text-lg font-bold text-slate-200">
                                {
                                  project
                                    .members
                                    .length
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}

                        <div className="relative mt-5 flex items-center justify-between border-t border-slate-800/70 pt-4">
                          <div className="min-w-0">
                            <p className="text-[9px] font-medium uppercase tracking-wider text-slate-600">
                              Owner
                            </p>

                            <p className="mt-1 truncate text-xs font-medium text-slate-400">
                              {project.owner.name}
                            </p>
                          </div>

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 text-slate-600 transition group-hover:border-slate-700 group-hover:text-slate-300">
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>
            </section>
          )}
      </div>
    </main>
  );
}