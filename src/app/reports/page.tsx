"use client";

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FolderKanban,
  ListTodo,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER"
  | "DESIGNER"
  | "MEMBER";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  progress?: number;
  status?: string;
  _count?: {
    tasks?: number;
    issues?: number;
    members?: number;
  };
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  projectId: string;
};

type Issue = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  type?: string;
  projectId: string;
};

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type ProjectReport = {
  id: string;
  name: string;
  progress: number;
  completed: number;
  inProgress: number;
  todo: number;
};

function isCompleted(status: string) {
  return [
    "COMPLETED",
    "DONE",
  ].includes(status);
}

function isInProgress(status: string) {
  return [
    "IN_PROGRESS",
  ].includes(status);
}

function isTodo(status: string) {
  return [
    "TODO",
    "PLANNED",
    "BACKLOG",
  ].includes(status);
}

export default function ReportsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [issues, setIssues] =
    useState<Issue[]>([]);

  const [members, setMembers] =
    useState<TeamUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadReports = useCallback(async () => {
    try {
      setError("");

      const [
        authResponse,
        projectsResponse,
        tasksResponse,
        issuesResponse,
        usersResponse,
      ] = await Promise.all([
        fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/projects", {
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/tasks", {
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/issues", {
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/users", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (authResponse.status === 401) {
        router.replace("/login");
        return;
      }

      if (!authResponse.ok) {
        throw new Error(
          "Failed to authenticate user."
        );
      }

      const authData =
        await authResponse.json();

      if (
        !authData.authenticated ||
        !authData.user
      ) {
        router.replace("/login");
        return;
      }

      setCurrentUser(authData.user);

      if (projectsResponse.status === 401) {
        router.replace("/login");
        return;
      }

      if (tasksResponse.status === 401) {
        router.replace("/login");
        return;
      }

      if (issuesResponse.status === 401) {
        router.replace("/login");
        return;
      }

      const projectsData =
        await projectsResponse.json();

      const tasksData =
        await tasksResponse.json();

      const issuesData =
        await issuesResponse.json();

      let usersData: any = null;

      if (usersResponse.ok) {
        usersData =
          await usersResponse.json();
      }

      if (!projectsResponse.ok) {
        throw new Error(
          projectsData.message ||
            "Failed to load projects."
        );
      }

      if (!tasksResponse.ok) {
        throw new Error(
          tasksData.message ||
            "Failed to load tasks."
        );
      }

      if (!issuesResponse.ok) {
        throw new Error(
          issuesData.message ||
            "Failed to load issues."
        );
      }

      const projectList =
        Array.isArray(projectsData)
          ? projectsData
          : Array.isArray(projectsData.projects)
          ? projectsData.projects
          : [];

      const taskList =
        Array.isArray(tasksData)
          ? tasksData
          : Array.isArray(tasksData.tasks)
          ? tasksData.tasks
          : [];

      const issueList =
        Array.isArray(issuesData)
          ? issuesData
          : Array.isArray(issuesData.issues)
          ? issuesData.issues
          : [];

      const userList =
        usersData &&
        Array.isArray(usersData.users)
          ? usersData.users
          : usersData &&
            Array.isArray(usersData.members)
          ? usersData.members
          : Array.isArray(usersData)
          ? usersData
          : [];

      setProjects(projectList);
      setTasks(taskList);
      setIssues(issueList);
      setMembers(userList);
    } catch (error) {
      console.error(
        "Reports error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load reports."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) =>
      isCompleted(task.status)
  ).length;

  const inProgressTasks = tasks.filter(
    (task) =>
      isInProgress(task.status)
  ).length;

  const todoTasks = tasks.filter(
    (task) =>
      isTodo(task.status)
  ).length;

  const openIssues = issues.filter(
    (issue) =>
      !isCompleted(issue.status)
  ).length;

  const resolvedIssues = issues.filter(
    (issue) =>
      isCompleted(issue.status)
  ).length;

  const completionPercentage =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0;

  const activeMembers = members.length;

  const projectReports = useMemo<ProjectReport[]>(
    () => {
      return projects.map((project) => {
        const projectTasks =
          tasks.filter(
            (task) =>
              task.projectId === project.id
          );

        const completed =
          projectTasks.filter((task) =>
            isCompleted(task.status)
          ).length;

        const inProgress =
          projectTasks.filter((task) =>
            isInProgress(task.status)
          ).length;

        const todo =
          projectTasks.filter((task) =>
            isTodo(task.status)
          ).length;

        const total = projectTasks.length;

        const progress =
          total > 0
            ? Math.round(
                (completed / total) * 100
              )
            : Number(project.progress ?? 0);

        return {
          id: project.id,
          name: project.name,
          progress,
          completed,
          inProgress,
          todo,
        };
      });
    },
    [projects, tasks]
  );

  const averageProjectProgress =
    projectReports.length > 0
      ? Math.round(
          projectReports.reduce(
            (total, project) =>
              total + project.progress,
            0
          ) / projectReports.length
        )
      : 0;

  const productivity = useMemo(() => {
    if (totalTasks === 0) {
      return 0;
    }

    const completedWeight =
      completedTasks / totalTasks;

    const progressWeight =
      inProgressTasks / totalTasks;

    return Math.min(
      100,
      Math.round(
        completedWeight * 100 +
          progressWeight * 25
      )
    );
  }, [
    totalTasks,
    completedTasks,
    inProgressTasks,
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-violet-400" />

            <p className="mt-4 text-sm text-slate-500">
              Loading reports...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        <section className="relative mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Reports
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Monitor project performance,
                task completion and team activity.
              </p>

              <p className="mt-4 text-xs text-slate-600">
                Welcome back,{" "}
                <span className="text-slate-400">
                  {currentUser.name}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-950/20 p-4">
            <p className="font-medium text-red-300">
              Failed to load reports
            </p>

            <p className="mt-1 text-sm text-red-400/80">
              {error}
            </p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Tasks Completed
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {completedTasks}
                </p>
              </div>

              <CheckCircle2 className="h-5 w-5 text-slate-500" />
            </div>

            <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUp className="h-3.5 w-3.5" />
              {completionPercentage}% completion
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Issues Resolved
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {resolvedIssues}
                </p>
              </div>

              <CheckCircle2 className="h-5 w-5 text-slate-500" />
            </div>

            <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
              {issues.length} total issues
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Open Issues
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {openIssues}
                </p>
              </div>

              <CircleAlert className="h-5 w-5 text-slate-500" />
            </div>

            <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
              Currently unresolved
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Average Completion
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {averageProjectProgress}%
                </p>
              </div>

              <TrendingUp className="h-5 w-5 text-slate-500" />
            </div>

            <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
              Across {projects.length} projects
            </div>
          </div>

        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-3">

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">

            <div>
              <h2 className="font-semibold">
                Task Overview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Current task distribution across
                your projects.
              </p>
            </div>

            <div className="mt-8">

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Overall completion
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {completionPercentage}%
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  {completedTasks} of {totalTasks} tasks
                </p>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{
                    width: `${completionPercentage}%`,
                  }}
                />
              </div>

            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-400" />

                  <span className="text-sm text-slate-500">
                    Completed
                  </span>
                </div>

                <p className="mt-3 text-2xl font-bold">
                  {completedTasks}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-400" />

                  <span className="text-sm text-slate-500">
                    In Progress
                  </span>
                </div>

                <p className="mt-3 text-2xl font-bold">
                  {inProgressTasks}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-slate-400" />

                  <span className="text-sm text-slate-500">
                    To Do
                  </span>
                </div>

                <p className="mt-3 text-2xl font-bold">
                  {todoTasks}
                </p>
              </div>

            </div>

          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">

            <div>
              <h2 className="font-semibold">
                Team Productivity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Current team activity.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center">
              <div
                className="relative flex h-44 w-44 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(white ${productivity}%, #1e293b ${productivity}% 100%)`,
                }}
              >
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-900">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {productivity}%
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Productivity
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />

                  <span className="text-sm text-slate-400">
                    Team members
                  </span>
                </div>

                <span className="text-sm font-medium">
                  {activeMembers}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-slate-500" />

                  <span className="text-sm text-slate-400">
                    Total tasks
                  </span>
                </div>

                <span className="text-sm font-medium">
                  {totalTasks}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CircleAlert className="h-4 w-4 text-slate-500" />

                  <span className="text-sm text-slate-400">
                    Open issues
                  </span>
                </div>

                <span className="text-sm font-medium">
                  {openIssues}
                </span>
              </div>

            </div>

          </section>

        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

          <div className="border-b border-slate-800 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                  Project Performance
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Compare progress across your projects.
                </p>
              </div>

              <div className="text-xs text-slate-600">
                {projectReports.length} projects
              </div>
            </div>
          </div>

          {projectReports.length === 0 ? (
            <div className="p-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
                <FolderKanban className="h-6 w-6 text-slate-600" />
              </div>

              <h3 className="mt-5 font-semibold text-slate-200">
                No projects found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create a project to start generating reports.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">

                <thead className="border-b border-slate-800">
                  <tr className="text-xs text-slate-500">

                    <th className="px-5 py-4 font-medium">
                      Project
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Progress
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Completed
                    </th>

                    <th className="px-5 py-4 font-medium">
                      In Progress
                    </th>

                    <th className="px-5 py-4 font-medium">
                      To Do
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">

                  {projectReports.map(
                    (project) => (
                      <tr
                        key={project.id}
                        className="transition hover:bg-slate-800/30"
                      >

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                              <FolderKanban className="h-4 w-4 text-slate-400" />
                            </div>

                            <span className="text-sm font-medium">
                              {project.name}
                            </span>

                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex min-w-[180px] items-center gap-3">

                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-white transition-all duration-500"
                                style={{
                                  width: `${project.progress}%`,
                                }}
                              />
                            </div>

                            <span className="w-10 text-right text-xs text-slate-400">
                              {project.progress}%
                            </span>

                          </div>
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-400">
                          {project.completed}
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-400">
                          {project.inProgress}
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-400">
                          {project.todo}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            </div>
          )}

        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs text-slate-500">
              Projects
            </p>

            <p className="mt-2 text-2xl font-bold">
              {projects.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs text-slate-500">
              Total Tasks
            </p>

            <p className="mt-2 text-2xl font-bold">
              {totalTasks}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs text-slate-500">
              Team Members
            </p>

            <p className="mt-2 text-2xl font-bold">
              {activeMembers}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs text-slate-500">
              Project Progress
            </p>

            <p className="mt-2 text-2xl font-bold">
              {averageProjectProgress}%
            </p>
          </div>

        </section>

      </div>
    </main>
  );
}