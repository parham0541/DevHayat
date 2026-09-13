"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FolderKanban,
  ListTodo,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";

import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import EditTaskDialog from "@/components/tasks/EditTaskDialog";
import DeleteTaskDialog from "@/components/tasks/DeleteTaskDialog";
import TaskStatusButton from "@/components/tasks/TaskStatusButton";

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

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
};

type Sprint = {
  id: string;
  name: string;
  status: string;
};

type User = {
  id: string;
  name: string;
  email: string;
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
  createdAt: string;
  updatedAt: string;
};

type StatusFilter = "ALL" | TaskStatus;

const statusConfig: Record<
  TaskStatus,
  {
    label: string;
    icon: typeof Circle;
    className: string;
    badgeClass: string;
  }
> = {
  TODO: {
    label: "To Do",
    icon: Circle,
    className: "text-slate-400",
    badgeClass:
      "border-slate-700 bg-slate-800 text-slate-300",
  },

  IN_PROGRESS: {
    label: "In Progress",
    icon: Clock3,
    className: "text-blue-400",
    badgeClass:
      "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },

  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-emerald-400",
    badgeClass:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },
};

const priorityConfig: Record<
  Priority,
  {
    label: string;
    className: string;
  }
> = {
  LOW: {
    label: "Low",
    className:
      "border-slate-700 bg-slate-800 text-slate-300",
  },

  MEDIUM: {
    label: "Medium",
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },

  HIGH: {
    label: "High",
    className:
      "border-orange-500/20 bg-orange-500/10 text-orange-400",
  },

  CRITICAL: {
    label: "Critical",
    className:
      "border-red-500/20 bg-red-500/10 text-red-400",
  },
};

function formatDate(date: string | null) {
  if (!date) {
    return "No due date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "COMPLETED") {
    return false;
  }

  const dueDate = new Date(task.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate.getTime() < Date.now();
}

function getStatusIcon(status: TaskStatus) {
  const Icon = statusConfig[status].icon;

  return (
    <Icon
      className={`h-4 w-4 ${statusConfig[status].className}`}
    />
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatRole(role: UserRole) {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");
}

export default function TasksPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const loadUser = useCallback(async () => {
    try {
      setLoadingUser(true);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return null;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to load current user."
        );
      }

      const data = await response.json();

      if (!data.authenticated || !data.user) {
        router.replace("/login");
        return null;
      }

      const currentUser = data.user as CurrentUser;

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      console.error(
        "Current user error:",
        error
      );

      router.replace("/login");

      return null;
    } finally {
      setLoadingUser(false);
    }
  }, [router]);

  const loadTasks = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/tasks", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (response.status === 403) {
        setTasks([]);

        setError(
          data.message ||
            "You do not have permission to view tasks."
        );

        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch tasks."
        );
      }

      setTasks(
        Array.isArray(data.tasks)
          ? data.tasks
          : []
      );
    } catch (error) {
      console.error(
        "Tasks load error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load tasks."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!loadingUser && user) {
      loadTasks();
    }
  }, [
    loadingUser,
    user,
    loadTasks,
  ]);

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    await loadTasks();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (
        statusFilter !== "ALL" &&
        task.status !== statusFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        task.title
          .toLowerCase()
          .includes(query) ||
        task.description
          ?.toLowerCase()
          .includes(query) ||
        task.project.name
          .toLowerCase()
          .includes(query) ||
        task.project.key
          .toLowerCase()
          .includes(query) ||
        task.sprint?.name
          .toLowerCase()
          .includes(query) ||
        task.assignee?.name
          .toLowerCase()
          .includes(query) ||
        task.assignee?.email
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    tasks,
    search,
    statusFilter,
  ]);

  const totalCount = tasks.length;

  const todoCount = tasks.filter(
    (task) =>
      task.status === "TODO"
  ).length;

  const inProgressCount = tasks.filter(
    (task) =>
      task.status === "IN_PROGRESS"
  ).length;

  const completedCount = tasks.filter(
    (task) =>
      task.status === "COMPLETED"
  ).length;

  const overdueCount = tasks.filter(
    isOverdue
  ).length;

  const completionRate =
    totalCount === 0
      ? 0
      : Math.round(
          (completedCount /
            totalCount) *
            100
        );

  const canManageTasks =
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER" ||
    user?.role === "DEVELOPER" ||
    user?.role === "DESIGNER";

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-violet-400" />

            <p className="mt-4 text-sm text-slate-400">
              Loading your workspace...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        <section className="relative mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                <Zap className="h-3.5 w-3.5" />

                My Workspace
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back,{" "}
                <span className="text-violet-400">
                  {user.name}
                </span>
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Manage your assigned tasks, track progress,
                and stay on top of your deadlines.
              </p>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-bold text-violet-300">
                  {getInitials(user.name)}
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {user.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {formatRole(user.role)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </button>

              {canManageTasks && (
                <CreateTaskDialog
                  onCreated={loadTasks}
                />
              )}
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  My Tasks
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {totalCount}
                </p>
              </div>

              <ListTodo className="h-5 w-5 text-slate-500" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  To Do
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {todoCount}
                </p>
              </div>

              <Circle className="h-5 w-5 text-slate-500" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  In Progress
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {inProgressCount}
                </p>
              </div>

              <Clock3 className="h-5 w-5 text-blue-400" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Completed
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {completedCount}
                </p>
              </div>

              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Overdue
                </p>

                <p
                  className={`mt-2 text-2xl font-bold ${
                    overdueCount > 0
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {overdueCount}
                </p>
              </div>

              <CalendarDays
                className={
                  overdueCount > 0
                    ? "h-5 w-5 text-red-400"
                    : "h-5 w-5 text-slate-500"
                }
              />
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_280px]">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search your tasks..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-500/40"
                />
              </div>

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter("ALL")
                  }
                  className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                    statusFilter === "ALL"
                      ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                      : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter("TODO")
                  }
                  className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                    statusFilter === "TODO"
                      ? "border-slate-600 bg-slate-800 text-white"
                      : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  To Do
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      "IN_PROGRESS"
                    )
                  }
                  className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                    statusFilter === "IN_PROGRESS"
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                      : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  In Progress
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      "COMPLETED"
                    )
                  }
                  className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                    statusFilter === "COMPLETED"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Completion
                </p>

                <p className="mt-1 text-2xl font-bold text-white">
                  {completionRate}%
                </p>
              </div>

              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{
                  background:
                    `conic-gradient(#a78bfa ${completionRate}%, #1e293b 0)`,
                }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-violet-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-950/20 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <div className="min-w-0">
              <p className="font-medium text-red-300">
                Failed to load your tasks
              </p>

              <p className="mt-1 break-words text-sm text-red-400/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-14 text-center">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-violet-400" />

            <p className="mt-4 text-sm text-slate-400">
              Loading your tasks...
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
              <ListTodo className="h-6 w-6 text-slate-600" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-200">
              No tasks found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search ||
              statusFilter !== "ALL"
                ? "Try changing your search or filters."
                : "You don't have any assigned tasks yet."}
            </p>

            {(search ||
              statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 text-sm font-medium text-violet-400 hover:text-violet-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Your Tasks
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Showing{" "}
                {filteredTasks.length}{" "}
                of {totalCount} tasks
              </p>
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-slate-800 bg-slate-900 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/60">
                    <tr>
                      <th className="px-5 py-4 text-xs font-medium text-slate-500">
                        Task
                      </th>

                      <th className="px-5 py-4 text-xs font-medium text-slate-500">
                        Project
                      </th>

                      <th className="px-5 py-4 text-xs font-medium text-slate-500">
                        Assignee
                      </th>

                      <th className="px-5 py-4 text-xs font-medium text-slate-500">
                        Priority
                      </th>

                      <th className="px-5 py-4 text-xs font-medium text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-medium text-slate-500">
                        Due Date
                      </th>

                      <th className="px-5 py-4 text-xs font-medium text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {filteredTasks.map(
                      (task) => {
                        const overdue =
                          isOverdue(task);

                        return (
                          <tr
                            key={task.id}
                            className="transition hover:bg-slate-950/40"
                          >
                            <td className="px-5 py-4">
                              <div className="flex max-w-md items-start gap-3">
                                <div className="mt-1">
                                  {getStatusIcon(
                                    task.status
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="font-medium text-slate-200">
                                    {task.title}
                                  </p>

                                  {task.description && (
                                    <p className="mt-1 truncate text-xs text-slate-500">
                                      {
                                        task.description
                                      }
                                    </p>
                                  )}

                                  {task.sprint && (
                                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                                      <Zap className="h-3 w-3" />

                                      {
                                        task
                                          .sprint
                                          .name
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <FolderKanban className="h-4 w-4 text-slate-600" />

                                <div>
                                  <p className="text-sm text-slate-300">
                                    {
                                      task
                                        .project
                                        .name
                                    }
                                  </p>

                                  <span className="mt-1 inline-block rounded border border-slate-800 bg-slate-950 px-2 py-0.5 text-xs text-slate-600">
                                    {
                                      task
                                        .project
                                        .key
                                    }
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              {task.assignee ? (
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[10px] font-bold text-slate-300">
                                    {getInitials(
                                      task
                                        .assignee
                                        .name
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-slate-300">
                                      {
                                        task
                                          .assignee
                                          .name
                                      }
                                    </p>

                                    <p className="truncate text-xs text-slate-600">
                                      {
                                        task
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

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${priorityConfig[task.priority].className}`}
                              >
                                {
                                  priorityConfig[
                                    task
                                      .priority
                                  ].label
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${statusConfig[task.status].badgeClass}`}
                              >
                                {getStatusIcon(
                                  task.status
                                )}

                                {
                                  statusConfig[
                                    task.status
                                  ].label
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div
                                className={`flex items-center gap-2 text-sm ${
                                  overdue
                                    ? "text-red-400"
                                    : "text-slate-400"
                                }`}
                              >
                                <CalendarDays className="h-4 w-4" />

                                {formatDate(
                                  task.dueDate
                                )}
                              </div>

                              {overdue && (
                                <p className="mt-1 text-xs text-red-500/80">
                                  Overdue
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {canManageTasks ? (
                                <div className="flex items-center gap-2">
                                  <TaskStatusButton
                                    taskId={
                                      task.id
                                    }
                                    status={
                                      task.status
                                    }
                                    onUpdated={
                                      loadTasks
                                    }
                                  />

                                  <EditTaskDialog
                                    task={task}
                                    onUpdated={
                                      loadTasks
                                    }
                                  />

                                  <DeleteTaskDialog
                                    taskId={
                                      task.id
                                    }
                                    taskTitle={
                                      task.title
                                    }
                                    onDeleted={
                                      loadTasks
                                    }
                                  />
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600">
                                  View only
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {filteredTasks.map(
                (task) => {
                  const overdue =
                    isOverdue(task);

                  return (
                    <article
                      key={task.id}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-1">
                            {getStatusIcon(
                              task.status
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-200">
                              {task.title}
                            </h3>

                            {task.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                                {
                                  task.description
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium ${priorityConfig[task.priority].className}`}
                        >
                          {
                            priorityConfig[
                              task.priority
                            ].label
                          }
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4">

                        <div>
                          <p className="text-xs text-slate-600">
                            Project
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {
                              task
                                .project
                                .name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            {
                              task
                                .project
                                .key
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-600">
                            Assignee
                          </p>

                          {task.assignee ? (
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[9px] font-bold text-slate-300">
                                {getInitials(
                                  task
                                    .assignee
                                    .name
                                )}
                              </div>

                              <p className="truncate text-sm text-slate-300">
                                {
                                  task
                                    .assignee
                                    .name
                                }
                              </p>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-slate-600">
                              Unassigned
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-slate-600">
                            Status
                          </p>

                          <span
                            className={`mt-1 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${statusConfig[task.status].badgeClass}`}
                          >
                            {getStatusIcon(
                              task.status
                            )}

                            {
                              statusConfig[
                                task.status
                              ].label
                            }
                          </span>
                        </div>

                        <div>
                          <p className="text-xs text-slate-600">
                            Due Date
                          </p>

                          <p
                            className={`mt-1 flex items-center gap-1.5 text-sm ${
                              overdue
                                ? "text-red-400"
                                : "text-slate-300"
                            }`}
                          >
                            <CalendarDays className="h-3.5 w-3.5" />

                            {formatDate(
                              task.dueDate
                            )}
                          </p>

                          {overdue && (
                            <p className="mt-1 text-xs text-red-500/80">
                              Overdue
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-slate-600">
                            Sprint
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {task.sprint
                              ?.name ||
                              "No sprint"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-800 pt-4">
                        {canManageTasks ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <TaskStatusButton
                              taskId={
                                task.id
                              }
                              status={
                                task.status
                              }
                              onUpdated={
                                loadTasks
                              }
                            />

                            <EditTaskDialog
                              task={task}
                              onUpdated={
                                loadTasks
                              }
                            />

                            <DeleteTaskDialog
                              taskId={
                                task.id
                              }
                              taskTitle={
                                task.title
                              }
                              onDeleted={
                                loadTasks
                              }
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">
                            View only
                          </span>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}