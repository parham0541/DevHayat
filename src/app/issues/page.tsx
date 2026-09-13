"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  CircleDot,
  Clock3,
  Filter,
  ListFilter,
  Search,
  SlidersHorizontal,
  UserCircle2,
  X,
  RefreshCw,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import CreateIssueDialog from "@/components/issues/CreateIssueDialog";
import EditIssueDialog from "@/components/issues/EditIssueDialog";
import DeleteIssueDialog from "@/components/issues/DeleteIssueDialog";

type IssueType = "TASK" | "BUG" | "STORY";

type IssuePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

type IssueStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "DONE";

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

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Project = {
  id: string;
  name: string;
  key: string;
};

type Issue = {
  id: string;
  title: string;
  description: string | null;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;

  project: Project;

  reporter: User;

  assignee: User | null;
};

const statusLabels: Record<IssueStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityLabels: Record<
  IssuePriority,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const typeLabels: Record<IssueType, string> = {
  TASK: "Task",
  BUG: "Bug",
  STORY: "Story",
};

function getStatusIcon(status: IssueStatus) {
  if (status === "DONE") {
    return <CheckCircle2 size={14} />;
  }

  if (status === "IN_PROGRESS") {
    return <Clock3 size={14} />;
  }

  return <CircleDot size={14} />;
}

function getTypeIcon(type: IssueType) {
  if (type === "BUG") {
    return <Bug size={14} />;
  }

  if (type === "STORY") {
    return <AlertCircle size={14} />;
  }

  return <ListFilter size={14} />;
}

function getStatusClass(status: IssueStatus) {
  if (status === "DONE") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";
  }

  if (status === "IN_PROGRESS") {
    return "border-blue-400/20 bg-blue-400/10 text-blue-400";
  }

  return "border-slate-700 bg-slate-800/60 text-slate-400";
}

function getPriorityClass(
  priority: IssuePriority
) {
  if (priority === "CRITICAL") {
    return "border-red-400/20 bg-red-400/10 text-red-400";
  }

  if (priority === "HIGH") {
    return "border-orange-400/20 bg-orange-400/10 text-orange-400";
  }

  if (priority === "MEDIUM") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-400";
  }

  return "border-slate-700 bg-slate-800/60 text-slate-400";
}

function getTypeClass(type: IssueType) {
  if (type === "BUG") {
    return "border-red-400/20 bg-red-400/10 text-red-400";
  }

  if (type === "STORY") {
    return "border-violet-400/20 bg-violet-400/10 text-violet-400";
  }

  return "border-blue-400/20 bg-blue-400/10 text-blue-400";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function formatRole(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "Administrator";

    case "PROJECT_MANAGER":
      return "Project Manager";

    case "DEVELOPER":
      return "Developer";

    case "DESIGNER":
      return "Designer";

    default:
      return "Member";
  }
}

export default function IssuesPage() {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [issues, setIssues] =
    useState<Issue[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<IssueStatus | "ALL">("ALL");

  const [priorityFilter, setPriorityFilter] =
    useState<IssuePriority | "ALL">("ALL");

  const [typeFilter, setTypeFilter] =
    useState<IssueType | "ALL">("ALL");

  const [showFilters, setShowFilters] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Authentication
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
   * Load issues
   */

  const loadIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/issues",
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
            "Failed to fetch issues"
        );
      }

      setIssues(data.issues || []);
    } catch (error) {
      console.error(
        "Load issues error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load issues."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Authentication first
   */

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /*
   * Issues after authentication
   */

  useEffect(() => {
    if (!loadingUser && user) {
      loadIssues();
    }
  }, [
    loadingUser,
    user,
    loadIssues,
  ]);

  /*
   * Filtering
   */

  const filteredIssues = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesSearch =
        !normalizedSearch ||
        issue.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        (issue.description ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        issue.project.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        issue.project.key
          .toLowerCase()
          .includes(normalizedSearch) ||
        issue.reporter.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        issue.assignee?.name
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        issue.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        issue.priority === priorityFilter;

      const matchesType =
        typeFilter === "ALL" ||
        issue.type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesType
      );
    });
  }, [
    issues,
    search,
    statusFilter,
    priorityFilter,
    typeFilter,
  ]);

  /*
   * Statistics
   */

  const issueStats = useMemo(() => {
    return {
      total: issues.length,

      open: issues.filter(
        (issue) =>
          issue.status !== "DONE"
      ).length,

      bugs: issues.filter(
        (issue) =>
          issue.type === "BUG"
      ).length,

      critical: issues.filter(
        (issue) =>
          issue.priority === "CRITICAL"
      ).length,
    };
  }, [issues]);

  const activeFilterCount = [
    statusFilter !== "ALL",
    priorityFilter !== "ALL",
    typeFilter !== "ALL",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setTypeFilter("ALL");
  };

  /*
   * Permissions
   *
   * Backend remains the real security layer.
   */

  const canCreateIssue =
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER" ||
    user?.role === "DEVELOPER";

  /*
   * Authentication loading
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
        <button
          type="button"
          onClick={() =>
            window.location.replace(
              "/login"
            )
          }
          className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-600"
        >
          Go to Login
        </button>
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

      <div className="relative z-10 p-5 sm:p-6 lg:p-8">
        {/* Header */}

        <header className="mb-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                <ListFilter className="h-4 w-4 text-violet-400" />

                <span>Workspace</span>

                <span className="text-slate-700">
                  /
                </span>

                <span className="text-slate-400">
                  Issues
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Issues
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Track bugs, tasks and stories
                across your projects.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadIssues}
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

              {canCreateIssue && (
                <CreateIssueDialog
                  onCreated={loadIssues}
                />
              )}
            </div>
          </div>
        </header>

        {/* Statistics */}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Total Issues
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {issueStats.total}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
                <ListFilter className="h-4 w-4 text-violet-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Open
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {issueStats.open}
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
                  Bugs
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {issueStats.bugs}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10">
                <Bug className="h-4 w-4 text-red-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Critical
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {issueStats.critical}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-400/20 bg-orange-500/10">
                <AlertCircle className="h-4 w-4 text-orange-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Search / Filters */}

        <section className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/45 p-4 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search issues, projects, reporters or assignees..."
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/5"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (value) => !value
                )
              }
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
                showFilters ||
                activeFilterCount > 0
                  ? "border-slate-700 bg-slate-800 text-white"
                  : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <SlidersHorizontal
                size={17}
              />

              Filters

              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-slate-900">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-3 border-t border-slate-800/70 pt-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-600">
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | IssueStatus
                        | "ALL"
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition focus:border-violet-500/40"
                >
                  <option value="ALL">
                    All statuses
                  </option>

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

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-600">
                  Priority
                </label>

                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target.value as
                        | IssuePriority
                        | "ALL"
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition focus:border-violet-500/40"
                >
                  <option value="ALL">
                    All priorities
                  </option>

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
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-slate-600">
                  Type
                </label>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value as
                        | IssueType
                        | "ALL"
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition focus:border-violet-500/40"
                >
                  <option value="ALL">
                    All types
                  </option>

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

              {activeFilterCount > 0 && (
                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-white"
                  >
                    <Filter size={14} />

                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Loading */}

        {loading && (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/55">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/5">
                <RefreshCw className="h-5 w-5 animate-spin text-violet-400" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-300">
                  Loading issues
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
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-rose-300">
                    Unable to load issues
                  </p>

                  <p className="mt-1 text-xs text-rose-400/70">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadIssues}
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
          filteredIssues.length === 0 && (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/55 p-8">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
                  {issues.length === 0 ? (
                    <ListFilter className="h-7 w-7 text-slate-600" />
                  ) : (
                    <Search className="h-7 w-7 text-slate-600" />
                  )}
                </div>

                <h2 className="mt-5 text-lg font-semibold">
                  {issues.length === 0
                    ? "No issues yet"
                    : "No issues found"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {issues.length === 0
                    ? canCreateIssue
                      ? "Create an issue to start tracking work."
                      : "There are no issues available in your projects."
                    : "Try changing your search or filters."}
                </p>

                {issues.length === 0 &&
                  canCreateIssue && (
                    <div className="mt-5">
                      <CreateIssueDialog
                        onCreated={
                          loadIssues
                        }
                      />
                    </div>
                  )}

                {(search ||
                  activeFilterCount > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      clearFilters();
                    }}
                    className="mt-5 text-xs font-medium text-violet-400 hover:text-violet-300"
                  >
                    Clear search and filters
                  </button>
                )}
              </div>
            </div>
          )}

        {/* Results */}

        {!loading &&
          !error &&
          filteredIssues.length > 0 && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <Layers3 className="h-4 w-4 text-violet-400" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Issue Tracker
                    </p>

                    <p className="text-[11px] text-slate-600">
                      {filteredIssues.length}{" "}
                      matching issue
                      {filteredIssues.length !==
                      1
                        ? "s"
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 sm:flex">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />

                  <span className="text-[10px] text-slate-500">
                    {formatRole(user.role)}
                  </span>
                </div>
              </div>

              {/* Desktop */}

              <div className="hidden overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/55 shadow-xl shadow-black/10 lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-slate-800/70 bg-slate-950/40 text-left">
                        <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                          Issue
                        </th>

                        <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                          Type
                        </th>

                        <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                          Priority
                        </th>

                        <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                          Status
                        </th>

                        <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                          Assignee
                        </th>

                        <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                          Created
                        </th>

                        <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800/60">
                      {filteredIssues.map(
                        (issue) => (
                          <tr
                            key={issue.id}
                            className="group transition-colors hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-4">
                              <div className="max-w-[330px]">
                                <p className="truncate text-sm font-semibold text-slate-200 transition group-hover:text-white">
                                  {issue.title}
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-600">
                                  {
                                    issue
                                      .project
                                      .key
                                  }{" "}
                                  ·{" "}
                                  {
                                    issue
                                      .project
                                      .name
                                  }
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${getTypeClass(
                                  issue.type
                                )}`}
                              >
                                {getTypeIcon(
                                  issue.type
                                )}

                                {
                                  typeLabels[
                                    issue.type
                                  ]
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-lg border px-2.5 py-1.5 text-xs font-medium ${getPriorityClass(
                                  issue.priority
                                )}`}
                              >
                                {
                                  priorityLabels[
                                    issue.priority
                                  ]
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${getStatusClass(
                                  issue.status
                                )}`}
                              >
                                {getStatusIcon(
                                  issue.status
                                )}

                                {
                                  statusLabels[
                                    issue.status
                                  ]
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {issue.assignee ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-slate-950 text-slate-400">
                                    <UserCircle2
                                      size={
                                        16
                                      }
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-slate-300">
                                      {
                                        issue
                                          .assignee
                                          .name
                                      }
                                    </p>

                                    <p className="truncate text-[10px] text-slate-600">
                                      {
                                        issue
                                          .assignee
                                          .email
                                      }
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600">
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-xs text-slate-500">
                              {formatDate(
                                issue.createdAt
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <EditIssueDialog
                                  issue={{
                                    id: issue.id,
                                    title:
                                      issue.title,
                                    description:
                                      issue.description,
                                    type:
                                      issue.type,
                                    priority:
                                      issue.priority,
                                    status:
                                      issue.status,
                                    projectId:
                                      issue
                                        .project
                                        .id,
                                    reporterId:
                                      issue
                                        .reporter
                                        .id,
                                    assigneeId:
                                      issue
                                        .assignee
                                        ?.id ||
                                      null,
                                  }}
                                  onUpdated={
                                    loadIssues
                                  }
                                />

                                <DeleteIssueDialog
                                  issueId={
                                    issue.id
                                  }
                                  issueTitle={
                                    issue.title
                                  }
                                  onDeleted={
                                    loadIssues
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile */}

              <div className="space-y-3 lg:hidden">
                {filteredIssues.map(
                  (issue) => (
                    <div
                      key={issue.id}
                      className="rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-xl shadow-black/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-semibold text-slate-200">
                            {issue.title}
                          </h2>

                          <p className="mt-1 truncate text-xs text-slate-600">
                            {issue.project.key}{" "}
                            ·{" "}
                            {issue.project.name}
                          </p>
                        </div>

                        <span className="shrink-0 text-[10px] text-slate-600">
                          {formatDate(
                            issue.createdAt
                          )}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${getTypeClass(
                            issue.type
                          )}`}
                        >
                          {getTypeIcon(
                            issue.type
                          )}

                          {
                            typeLabels[
                              issue.type
                            ]
                          }
                        </span>

                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1.5 text-xs font-medium ${getPriorityClass(
                            issue.priority
                          )}`}
                        >
                          {
                            priorityLabels[
                              issue.priority
                            ]
                          }
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${getStatusClass(
                            issue.status
                          )}`}
                        >
                          {getStatusIcon(
                            issue.status
                          )}

                          {
                            statusLabels[
                              issue.status
                            ]
                          }
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/70 pt-4">
                        <div className="min-w-0">
                          {issue.assignee ? (
                            <div className="flex items-center gap-2">
                              <UserCircle2
                                size={18}
                                className="shrink-0 text-slate-500"
                              />

                              <div className="min-w-0">
                                <p className="truncate text-xs text-slate-300">
                                  {
                                    issue
                                      .assignee
                                      .name
                                  }
                                </p>

                                <p className="text-[10px] text-slate-600">
                                  Assignee
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">
                              Unassigned
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <EditIssueDialog
                            issue={{
                              id: issue.id,
                              title:
                                issue.title,
                              description:
                                issue.description,
                              type:
                                issue.type,
                              priority:
                                issue.priority,
                              status:
                                issue.status,
                              projectId:
                                issue.project.id,
                              reporterId:
                                issue.reporter
                                  .id,
                              assigneeId:
                                issue
                                  .assignee
                                  ?.id ||
                                null,
                            }}
                            onUpdated={
                              loadIssues
                            }
                          />

                          <DeleteIssueDialog
                            issueId={
                              issue.id
                            }
                            issueTitle={
                              issue.title
                            }
                            onDeleted={
                              loadIssues
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
      </div>
    </main>
  );
}
