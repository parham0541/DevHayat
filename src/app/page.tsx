"use client";

import {
ArrowUpRight,
CheckCircle2,
CircleAlert,
FolderKanban,
ListTodo,
Users,
RefreshCw,
Clock3,
Target,
Zap,
Activity,
Layers3,
TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type CurrentUser = {
id: string;
name: string;
email: string;
role: string;
};

type DashboardData = {
statistics: {
projects: {
total: number;
active: number;
completed: number;
};

tasks: {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
};

issues: {
  total: number;
  open: number;
  resolved: number;
};

sprints: {
  total: number;
  planned: number;
  active: number;
  completed: number;
};


};

recentIssues: {
id: string;
title: string;
type: string;
priority: string;
status: string;

 
project: {
  id: string;
  name: string;
  key: string;
};

assignee: {
  id: string;
  name: string;
  email: string;
} | null;
 

}[];

recentTasks: {
id: string;
title: string;
status: string;
priority: string;

 
project: {
  id: string;
  name: string;
  key: string;
};

assignee: {
  id: string;
  name: string;
  email: string;
} | null;
 

}[];

activeSprint: {
id: string;
name: string;
goal: string | null;
status: string;
startDate: string | null;
endDate: string | null;

 
project: {
  id: string;
  name: string;
  key: string;
};

creator: {
  id: string;
  name: string;
  email: string;
};

_count: {
  tasks: number;
};
 

} | null;

projects: {
id: string;
name: string;
key: string;
status: string;
progress: number;

 
_count: {
  tasks: number;
  issues: number;
  sprints: number;
  members: number;
};
 

}[];
};

function formatStatus(status: string) {
switch (status) {
case "TODO":
return "To Do";

 
case "IN_PROGRESS":
  return "In Progress";

case "COMPLETED":
  return "Completed";

case "DONE":
  return "Done";

case "ACTIVE":
  return "Active";

case "PLANNED":
  return "Planned";

case "ARCHIVED":
  return "Archived";

default:
  return status;
 

}
}

function formatPriority(priority: string) {
if (!priority) return "";

return (
priority.charAt(0) +
priority.slice(1).toLowerCase()
);
}

function getProjectStatus(status: string) {
switch (status) {
case "ACTIVE":
return "Active";

 
case "COMPLETED":
  return "Completed";

case "PLANNING":
  return "Planning";

case "ON_HOLD":
  return "On Hold";

case "ARCHIVED":
  return "Archived";

default:
  return status;
 

}
}

function getStatusClass(status: string) {
switch (status) {
case "DONE":
case "COMPLETED":
return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";

 
case "IN_PROGRESS":
case "ACTIVE":
  return "border-blue-400/20 bg-blue-400/10 text-blue-400";

case "TODO":
case "PLANNED":
  return "border-amber-400/20 bg-amber-400/10 text-amber-400";

default:
  return "border-slate-700/70 bg-slate-800/50 text-slate-400";
 

}
}

function getPriorityClass(priority: string) {
switch (priority) {
case "HIGH":
return "text-red-400";

 
case "MEDIUM":
  return "text-amber-400";

case "LOW":
  return "text-emerald-400";

default:
  return "text-slate-400";
 

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

export default function Home() {
const [user, setUser] =
useState<CurrentUser | null>(null);

const [loadingUser, setLoadingUser] =
useState(true);

const [data, setData] =
useState<DashboardData | null>(null);

const [loading, setLoading] =
useState(true);

const [error, setError] =
useState<string | null>(null);

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

  const result = await response.json();

  if (
    !response.ok ||
    !result.success ||
    !result.user
  ) {
    window.location.replace("/login");
    return;
  }

  setUser(result.user);
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

const loadDashboard = useCallback(async () => {
try {
setLoading(true);
setError(null);

 
  const response = await fetch(
    "/api/dashboard",
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (response.status === 401) {
    window.location.replace("/login");
    return;
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to load dashboard"
    );
  }

  setData(result);
} catch (error) {
  console.error(
    "Dashboard error:",
    error
  );

  setError(
    "Unable to load dashboard data."
  );
} finally {
  setLoading(false);
}
 

}, []);

useEffect(() => {
loadUser();
}, [loadUser]);

useEffect(() => {
if (!loadingUser && user) {
loadDashboard();
}
}, [
loadingUser,
user,
loadDashboard,
]);

if (loadingUser) {
return ( <main className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050816] px-4 text-white"> <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />

 
    <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

    <div className="relative flex items-center gap-3 text-sm text-slate-400">
      <RefreshCw className="h-4 w-4 animate-spin text-violet-400" />

      Loading workspace...
    </div>
  </main>
);
 

}

if (!user) {
return ( <main className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050816] px-4 text-white"> <div className="text-center"> <p className="text-sm text-slate-400">
Authentication required. </p>

 
      <Link
        href="/login"
        className="mt-4 inline-flex rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-600"
      >
        Go to Login
      </Link>
    </div>
  </main>
);
 

}

const completedPercentage =
data &&
data.statistics.tasks.total > 0
? Math.round(
(data.statistics.tasks.completed /
data.statistics.tasks.total) *
100
)
: 0;

const inProgressPercentage =
data &&
data.statistics.tasks.total > 0
? Math.round(
(data.statistics.tasks.inProgress /
data.statistics.tasks.total) *
100
)
: 0;

const todoPercentage =
data &&
data.statistics.tasks.total > 0
? Math.round(
(data.statistics.tasks.todo /
data.statistics.tasks.total) *
100
)
: 0;

const totalMembers =
data?.projects.reduce(
(total, project) =>
total + project._count.members,
0
) ?? 0;

const stats = data
? [
{
title: "Projects",
value:
data.statistics.projects.total,
description: `${data.statistics.projects.active} active projects`,
icon: FolderKanban,
iconColor: "text-violet-400",
iconBackground:
"bg-violet-500/10 border-violet-400/20",
glow: "bg-violet-500/10",
},

 
    {
      title: "Tasks",
      value:
        data.statistics.tasks.total,
      description: `${data.statistics.tasks.inProgress} currently in progress`,
      icon: ListTodo,
      iconColor: "text-blue-400",
      iconBackground:
        "bg-blue-500/10 border-blue-400/20",
      glow: "bg-blue-500/10",
    },

    {
      title: "Open Issues",
      value:
        data.statistics.issues.open,
      description: `${data.statistics.issues.total} total issues`,
      icon: CircleAlert,
      iconColor: "text-rose-400",
      iconBackground:
        "bg-rose-500/10 border-rose-400/20",
      glow: "bg-rose-500/10",
    },

    {
      title: "Team Members",
      value: totalMembers,
      description:
        "Across your projects",
      icon: Users,
      iconColor: "text-emerald-400",
      iconBackground:
        "bg-emerald-500/10 border-emerald-400/20",
      glow: "bg-emerald-500/10",
    },
  ]
: [];
 

return ( <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#050816] text-white"> <div className="pointer-events-none fixed inset-0 overflow-hidden"> <div className="absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[150px] sm:h-[600px] sm:w-[600px]" />

    <div className="absolute -right-48 top-[-100px] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[150px] sm:h-[600px] sm:w-[600px]" />

    <div className="absolute bottom-[-200px] left-[35%] h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[150px] sm:h-[500px] sm:w-[500px]" />

    <div
      className="absolute inset-0 opacity-[0.035]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
        `,
        backgroundSize: "42px 42px",
      }}
    />

    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,8,22,0.45)_65%,rgba(5,8,22,0.95)_100%)]" />
  </div>

  <div className="relative z-10 w-full min-w-0">
    <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10">
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/5 px-3 py-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>

              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Workspace Online
              </span>
            </div>

            <h1 className="break-words text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
                {user.name}
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Your workspace is ready. Here is
              everything happening across your
              projects today.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="group inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
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

            <Link
              href="/reports"
              className="group inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.08)] transition-all duration-300 hover:bg-slate-200 sm:flex-none"
            >
              View Reports

              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {loading && !data && (
        <div className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin text-violet-400" />

            Loading your workspace...
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                <CircleAlert className="h-4 w-4 text-rose-400" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-rose-300">
                  Dashboard unavailable
                </p>

                <p className="mt-1 break-words text-xs text-rose-400/70">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="w-full rounded-lg border border-rose-400/20 px-4 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 sm:w-auto"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {data && (
        <>
          <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-2xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 sm:p-5"
                >
                  <div
                    className={`absolute -right-12 -top-12 h-32 w-32 rounded-full ${stat.glow} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                  />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-400">
                          {stat.title}
                        </p>

                        <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                          {stat.value}
                        </p>
                      </div>

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${stat.iconBackground}`}
                      >
                        <Icon
                          className={`h-5 w-5 ${stat.iconColor}`}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex min-w-0 items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-400" />

                      <p className="truncate text-xs text-slate-500">
                        {stat.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mt-6 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/55 shadow-2xl shadow-black/10 xl:col-span-2">
              <div className="flex flex-col gap-3 border-b border-slate-800/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <Layers3 className="h-4 w-4 text-violet-400" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-white">
                      Recent Projects
                    </h2>

                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      Your latest workspace activity
                    </p>
                  </div>
                </div>

                <Link
                  href="/projects"
                  className="group flex w-fit shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  View all

                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>

              {data.projects.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center p-6">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
                      <FolderKanban className="h-6 w-6 text-slate-600" />
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-400">
                      No projects yet
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Create a project to get started.
                    </p>

                    <Link
                      href="/projects"
                      className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
                    >
                      Create project

                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {data.projects
                    .slice(0, 5)
                    .map((project, index) => (
                      <Link
                        href={`/projects/${project.id}`}
                        key={project.id}
                        className="group block min-w-0 p-4 transition-all duration-300 hover:bg-white/[0.025] sm:p-5"
                      >
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <div
                                className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-r ${getProjectGradient(
                                  index
                                )}`}
                              />

                              <h3 className="min-w-0 truncate text-sm font-semibold text-slate-200 transition group-hover:text-white">
                                {project.name}
                              </h3>

                              <span className="shrink-0 rounded-md border border-slate-700/70 bg-slate-950/50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500">
                                {project.key}
                              </span>
                            </div>

                            <p className="mt-2 truncate text-xs text-slate-600">
                              {project._count.tasks} tasks
                              <span className="mx-1.5">
                                •
                              </span>
                              {project._count.issues} issues
                              <span className="mx-1.5">
                                •
                              </span>
                              {project._count.members} members
                            </p>
                          </div>

                          <span
                            className={`w-fit shrink-0 rounded-full border px-3 py-1 text-[10px] font-medium ${getStatusClass(
                              project.status
                            )}`}
                          >
                            {getProjectStatus(
                              project.status
                            )}
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                              Progress
                            </span>

                            <span className="text-xs font-bold text-slate-300">
                              {project.progress}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${getProjectGradient(
                                index
                              )} transition-all duration-700`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    project.progress
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </div>

            <div className="min-w-0 rounded-2xl border border-slate-800/70 bg-slate-900/55 p-4 shadow-2xl shadow-black/10 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Activity className="h-4 w-4 text-blue-400" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      Task Progress
                    </h2>

                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      Current workload
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-blue-400">
                  Live
                </span>
              </div>

              <div className="relative mt-8 flex justify-center sm:mt-9">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full sm:h-48 sm:w-48"
                  style={{
                    background: `conic-gradient(
                      rgb(139 92 246) 0deg,
                      rgb(99 102 241) ${
                        completedPercentage * 3.6
                      }deg,
                      rgb(30 41 59) ${
                        completedPercentage * 3.6
                      }deg
                    )`,
                  }}
                >
                  <div className="absolute inset-[8px] rounded-full bg-[#0b1020] sm:inset-[9px]" />

                  <div className="relative z-10 text-center">
                    <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                      {completedPercentage}%
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Completed
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />

                      <span className="text-xs text-slate-400">
                        Completed
                      </span>
                    </div>

                    <span className="text-xs font-semibold">
                      {data.statistics.tasks.completed}
                    </span>
                  </div>

                  <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${completedPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />

                      <span className="text-xs text-slate-400">
                        In Progress
                      </span>
                    </div>

                    <span className="text-xs font-semibold">
                      {data.statistics.tasks.inProgress}
                    </span>
                  </div>

                  <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{
                        width: `${inProgressPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />

                      <span className="text-xs text-slate-400">
                        To Do
                      </span>
                    </div>

                    <span className="text-xs font-semibold">
                      {data.statistics.tasks.todo}
                    </span>
                  </div>

                  <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{
                        width: `${todoPercentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {data.activeSprint && (
            <section className="group relative mt-6 min-w-0 overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-900/55 shadow-2xl shadow-black/10">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.08] via-transparent to-blue-500/[0.06]" />

              <div className="relative flex min-w-0 flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
                      <Zap className="h-5 w-5 text-violet-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                        <h2 className="max-w-full break-words font-semibold">
                          {data.activeSprint.name}
                        </h2>

                        <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                          Active Sprint
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-500">
                        Currently running in your workspace
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 max-w-2xl break-words text-sm leading-6 text-slate-400">
                    {data.activeSprint.goal ||
                      "No sprint goal defined."}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5 shrink-0 text-slate-600" />

                      <span className="truncate">
                        {data.activeSprint.project.name}
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 shrink-0 text-slate-600" />

                      {data.activeSprint._count.tasks} tasks
                    </span>

                    {data.activeSprint.endDate && (
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-600" />

                        Ends{" "}
                        {new Date(
                          data.activeSprint.endDate
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full shrink-0 rounded-2xl border border-slate-800/70 bg-slate-950/50 px-6 py-5 sm:w-fit">
                  <p className="text-3xl font-bold tracking-tight">
                    {data.activeSprint._count.tasks}
                  </p>

                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Sprint Tasks
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/55 shadow-2xl shadow-black/10">
            <div className="flex flex-col gap-4 border-b border-slate-800/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                  <CircleAlert className="h-4 w-4 text-rose-400" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-semibold">
                    Recent Issues
                  </h2>

                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    Latest issues across your projects
                  </p>
                </div>
              </div>

              <Link
                href="/issues"
                className="group flex w-fit shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                View all

                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {data.recentIssues.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-400/5">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400/60" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-slate-400">
                    No recent issues
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Everything looks clean.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-800/70 text-left text-[10px] uppercase tracking-[0.15em] text-slate-600">
                      <th className="px-4 py-4 font-medium sm:px-5">
                        Issue
                      </th>

                      <th className="px-4 py-4 font-medium sm:px-5">
                        Project
                      </th>

                      <th className="px-4 py-4 font-medium sm:px-5">
                        Priority
                      </th>

                      <th className="px-4 py-4 font-medium sm:px-5">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60">
                    {data.recentIssues.map(
                      (issue) => (
                        <tr
                          key={issue.id}
                          className="group transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-4 sm:px-5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50">
                                <CircleAlert className="h-3.5 w-3.5 text-slate-600 transition group-hover:text-rose-400" />
                              </div>

                              <span className="max-w-[360px] truncate text-sm font-medium text-slate-300 transition group-hover:text-white">
                                {issue.title}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4 sm:px-5">
                            <span className="rounded-md border border-slate-800 bg-slate-950/50 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-500">
                              {issue.project.key}
                            </span>
                          </td>

                          <td className="px-4 py-4 sm:px-5">
                            <span
                              className={`text-xs font-medium ${getPriorityClass(
                                issue.priority
                              )}`}
                            >
                              {formatPriority(
                                issue.priority
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-4 sm:px-5">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-medium ${getStatusClass(
                                issue.status
                              )}`}
                            >
                              {formatStatus(
                                issue.status
                              )}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  </div>
</main>


);
}
