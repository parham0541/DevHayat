"use client";

import {
useCallback,
useEffect,
useMemo,
useState,
} from "react";
import { useRouter } from "next/navigation";
import {
CalendarDays,
CheckCircle2,
Circle,
Clock3,
FolderKanban,
ListTodo,
Loader2,
RefreshCw,
Search,
Target,
Users,
XCircle,
} from "lucide-react";

import CreateSprintDialog from "@/components/sprints/CreateSprintDialog";
import EditSprintDialog from "@/components/sprints/EditSprintDialog";
import DeleteSprintDialog from "@/components/sprints/DeleteSprintDialog";
import SprintStatusButton from "@/components/sprints/SprintStatusButton";

type SprintStatus =
| "PLANNED"
| "ACTIVE"
| "COMPLETED";

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
status?: string;
};

type User = {
id: string;
name: string;
email: string;
role?: UserRole;
};

type Sprint = {
id: string;
name: string;
goal: string | null;
status: SprintStatus;
startDate: string | null;
endDate: string | null;
createdAt: string;
updatedAt: string;

project: Project;

creator: User;

_count: {
tasks: number;
};
};

type AuthResponse = {
success: boolean;
authenticated?: boolean;
user?: CurrentUser | null;
message?: string;
};

type SprintsResponse = {
success: boolean;
sprints?: Sprint[];
message?: string;
};

type ProjectsResponse = {
success: boolean;
projects?: Project[];
message?: string;
};

type UsersResponse = {
success: boolean;
users?: User[];
members?: User[];
message?: string;
};

function formatDate(date: string | null) {
if (!date) {
return "No date";
}

const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) {
return "Invalid date";
}

return parsedDate.toLocaleDateString("en-US", {
year: "numeric",
month: "short",
day: "numeric",
});
}

function getDuration(
startDate: string | null,
endDate: string | null
) {
if (!startDate || !endDate) {
return "No duration";
}

const start = new Date(startDate);
const end = new Date(endDate);

if (
Number.isNaN(start.getTime()) ||
Number.isNaN(end.getTime())
) {
return "No duration";
}

const difference = Math.ceil(
(end.getTime() - start.getTime()) /
(1000 * 60 * 60 * 24)
);

if (difference < 0) {
return "Invalid range";
}

const totalDays = difference + 1;

return `${totalDays} day${
    totalDays === 1 ? "" : "s"
  }`;
}

function getStatusClass(status: SprintStatus) {
switch (status) {
case "ACTIVE":
return "border-blue-500/20 bg-blue-500/10 text-blue-400";


case "COMPLETED":
  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

case "PLANNED":
default:
  return "border-slate-700 bg-slate-800/60 text-slate-400";

}
}

function getStatusIcon(status: SprintStatus) {
switch (status) {
case "ACTIVE":
return Clock3;


case "COMPLETED":
  return CheckCircle2;

case "PLANNED":
default:
  return Circle;


}
}

function getStatusLabel(status: SprintStatus) {
switch (status) {
case "ACTIVE":
return "Active";


case "COMPLETED":
  return "Completed";

case "PLANNED":
default:
  return "Planned";

}
}

export default function SprintsPage() {
const router = useRouter();

const [currentUser, setCurrentUser] =
useState<CurrentUser | null>(null);

const [sprints, setSprints] = useState<Sprint[]>(
[]
);

const [projects, setProjects] = useState<Project[]>(
[]
);

const [users, setUsers] = useState<User[]>([]);

const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] =
useState(false);

const [error, setError] = useState("");

const [search, setSearch] = useState("");

const [statusFilter, setStatusFilter] =
useState<"ALL" | SprintStatus>("ALL");

const [projectFilter, setProjectFilter] =
useState("ALL");

const canManage =
currentUser?.role === "ADMIN" ||
currentUser?.role === "PROJECT_MANAGER";

const loadPageData = useCallback(
async (showRefresh = false) => {
if (showRefresh) {
setRefreshing(true);
} else {
setLoading(true);
}

  setError("");

  try {
    const authResponse = await fetch(
      "/api/auth/me",
      {
        cache: "no-store",
      }
    );

    const authData: AuthResponse =
      await authResponse.json();

    if (
      authResponse.status === 401 ||
      !authData.authenticated ||
      !authData.user
    ) {
      router.replace("/login");
      return;
    }

    if (!authResponse.ok) {
      throw new Error(
        authData.message ||
          "Failed to authenticate user."
      );
    }

    setCurrentUser(authData.user);

    const [
      sprintsResponse,
      projectsResponse,
      usersResponse,
    ] = await Promise.all([
      fetch("/api/sprints", {
        cache: "no-store",
      }),
      fetch("/api/projects", {
        cache: "no-store",
      }),
      fetch("/api/users", {
        cache: "no-store",
      }),
    ]);

    const sprintsData: SprintsResponse =
      await sprintsResponse.json();

    const projectsData: ProjectsResponse =
      await projectsResponse.json();

    const usersData: UsersResponse =
      await usersResponse.json();

    if (
      sprintsResponse.status === 401 ||
      projectsResponse.status === 401 ||
      usersResponse.status === 401
    ) {
      router.replace("/login");
      return;
    }

    if (
      !sprintsResponse.ok ||
      !sprintsData.success
    ) {
      throw new Error(
        sprintsData.message ||
          "Failed to fetch sprints."
      );
    }

    if (
      !projectsResponse.ok ||
      !projectsData.success
    ) {
      throw new Error(
        projectsData.message ||
          "Failed to fetch projects."
      );
    }

    if (
      !usersResponse.ok ||
      !usersData.success
    ) {
      throw new Error(
        usersData.message ||
          "Failed to fetch users."
      );
    }

    setSprints(sprintsData.sprints ?? []);
    setProjects(projectsData.projects ?? []);

    setUsers(
      usersData.users ??
        usersData.members ??
        []
    );
  } catch (error) {
    console.error(
      "Load sprints page error:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Failed to load sprint data."
    );
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
},
[router]


);

useEffect(() => {
loadPageData();
}, [loadPageData]);

const statistics = useMemo(() => {
const tasks = sprints.reduce(
(total, sprint) =>
total + (sprint._count?.tasks ?? 0),
0
);


return {
  total: sprints.length,

  planned: sprints.filter(
    (sprint) =>
      sprint.status === "PLANNED"
  ).length,

  active: sprints.filter(
    (sprint) =>
      sprint.status === "ACTIVE"
  ).length,

  completed: sprints.filter(
    (sprint) =>
      sprint.status === "COMPLETED"
  ).length,

  tasks,
};


}, [sprints]);

const filteredSprints = useMemo(() => {
const normalizedSearch =
search.trim().toLowerCase();

return sprints.filter((sprint) => {
  const matchesSearch =
    !normalizedSearch ||
    sprint.name
      .toLowerCase()
      .includes(normalizedSearch) ||
    sprint.project.name
      .toLowerCase()
      .includes(normalizedSearch) ||
    sprint.project.key
      .toLowerCase()
      .includes(normalizedSearch) ||
    sprint.creator.name
      .toLowerCase()
      .includes(normalizedSearch) ||
    (sprint.goal ?? "")
      .toLowerCase()
      .includes(normalizedSearch);

  const matchesStatus =
    statusFilter === "ALL" ||
    sprint.status === statusFilter;

  const matchesProject =
    projectFilter === "ALL" ||
    sprint.project.id === projectFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesProject
  );
});


}, [
sprints,
search,
statusFilter,
projectFilter,
]);

return ( <div className="min-h-screen bg-slate-950 text-white"> <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"> <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"> <div> <div className="mb-3 flex items-center gap-2"> <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"> <Target className="h-5 w-5 text-blue-400" /> </div>


          <span className="text-sm font-medium text-blue-400">
            Sprint Management
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Sprints
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Plan, track, and manage development
          sprints across your projects.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            loadPageData(true)
          }
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Refresh
        </button>

        {canManage && (
          <CreateSprintDialog
            projects={projects}
            users={users}
            onCreated={() =>
              loadPageData(true)
            }
          />
        )}
      </div>
    </header>

    <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Sprints"
        value={statistics.total}
        icon={Target}
      />

      <StatCard
        title="Planned"
        value={statistics.planned}
        icon={Circle}
      />

      <StatCard
        title="Active"
        value={statistics.active}
        icon={Clock3}
      />

      <StatCard
        title="Completed"
        value={statistics.completed}
        icon={CheckCircle2}
      />

      <StatCard
        title="Total Tasks"
        value={statistics.tasks}
        icon={ListTodo}
      />
    </section>

    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search sprints, projects, creators..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
              aria-label="Clear search"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as
                | "ALL"
                | SprintStatus
            )
          }
          className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500/60 lg:w-44"
        >
          <option value="ALL">
            All Statuses
          </option>

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

        <select
          value={projectFilter}
          onChange={(event) =>
            setProjectFilter(
              event.target.value
            )
          }
          className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500/60 lg:w-64"
        >
          <option value="ALL">
            All Projects
          </option>

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.key} -{" "}
              {project.name}
            </option>
          ))}
        </select>
      </div>
    </section>

    {error && (
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-red-500/20 bg-red-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-red-300">
            Unable to load sprint data
          </p>

          <p className="mt-1 text-xs text-red-400/80">
            {error}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadPageData(true)
          }
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
        >
          Retry
        </button>
      </div>
    )}

    {loading ? (
      <LoadingState />
    ) : filteredSprints.length === 0 ? (
      <EmptyState
        hasFilters={
          Boolean(search) ||
          statusFilter !== "ALL" ||
          projectFilter !== "ALL"
        }
        canManage={canManage}
        projects={projects}
        users={users}
        onCreated={() =>
          loadPageData(true)
        }
      />
    ) : (
      <>
        <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40">
                  <TableHeader>
                    Sprint
                  </TableHeader>

                  <TableHeader>
                    Project
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader>
                    Timeline
                  </TableHeader>

                  <TableHeader>
                    Creator
                  </TableHeader>

                  <TableHeader>
                    Tasks
                  </TableHeader>

                  {canManage && (
                    <TableHeader align="right">
                      Actions
                    </TableHeader>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {filteredSprints.map(
                  (sprint) => {
                    const StatusIcon =
                      getStatusIcon(
                        sprint.status
                      );

                    return (
                      <tr
                        key={sprint.id}
                        className="transition hover:bg-slate-800/30"
                      >
                        <td className="max-w-xs px-5 py-5 align-top">
                          <p className="font-semibold text-white">
                            {sprint.name}
                          </p>

                          {sprint.goal && (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                              {sprint.goal}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                              <FolderKanban className="h-4 w-4 text-blue-400" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-200">
                                {sprint.project.key}
                              </p>

                              <p className="max-w-40 truncate text-xs text-slate-500">
                                {sprint.project.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              sprint.status
                            )}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />

                            {getStatusLabel(
                              sprint.status
                            )}
                          </span>

                          {canManage && (
                            <div className="mt-2">
                              <SprintStatusButton
                                sprintId={
                                  sprint.id
                                }
                                status={
                                  sprint.status
                                }
                                onUpdated={() =>
                                  loadPageData(
                                    true
                                  )
                                }
                              />
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                            <div>
                              <p className="text-sm text-slate-300">
                                {formatDate(
                                  sprint.startDate
                                )}
                              </p>

                              <p className="text-xs text-slate-600">
                                to{" "}
                                {formatDate(
                                  sprint.endDate
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {getDuration(
                                  sprint.startDate,
                                  sprint.endDate
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                              {sprint.creator.name
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm text-slate-300">
                                {sprint.creator.name}
                              </p>

                              <p className="text-xs text-slate-600">
                                {sprint.creator.role ??
                                  "MEMBER"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <ListTodo className="h-4 w-4 text-slate-500" />

                            {sprint._count
                              ?.tasks ?? 0}
                          </div>
                        </td>

                        {canManage && (
                          <td className="px-5 py-5 align-top">
                            <div className="flex justify-end gap-2">
                              <EditSprintDialog
                                sprint={sprint}
                                projects={
                                  projects
                                }
                                users={users}
                                onUpdated={() =>
                                  loadPageData(
                                    true
                                  )
                                }
                              />

                              <DeleteSprintDialog
                                sprintId={
                                  sprint.id
                                }
                                sprintName={
                                  sprint.name
                                }
                                taskCount={
                                  sprint._count
                                    ?.tasks ?? 0
                                }
                                status={
                                  sprint.status
                                }
                                onDeleted={() =>
                                  loadPageData(
                                    true
                                  )
                                }
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 lg:hidden">
          {filteredSprints.map(
            (sprint) => {
              const StatusIcon =
                getStatusIcon(
                  sprint.status
                );

              return (
                <div
                  key={sprint.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-white">
                        {sprint.name}
                      </h2>

                      {sprint.goal && (
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                          {sprint.goal}
                        </p>
                      )}
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                        sprint.status
                      )}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />

                      {getStatusLabel(
                        sprint.status
                      )}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      icon={FolderKanban}
                      label="Project"
                      value={`${sprint.project.key} - ${sprint.project.name}`}
                    />

                    <InfoItem
                      icon={Users}
                      label="Creator"
                      value={
                        sprint.creator.name
                      }
                    />

                    <InfoItem
                      icon={CalendarDays}
                      label="Start Date"
                      value={formatDate(
                        sprint.startDate
                      )}
                    />

                    <InfoItem
                      icon={CalendarDays}
                      label="End Date"
                      value={formatDate(
                        sprint.endDate
                      )}
                    />

                    <InfoItem
                      icon={ListTodo}
                      label="Tasks"
                      value={`${sprint._count?.tasks ?? 0}`}
                    />

                    <InfoItem
                      icon={Clock3}
                      label="Duration"
                      value={getDuration(
                        sprint.startDate,
                        sprint.endDate
                      )}
                    />
                  </div>

                  {canManage && (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <div className="flex flex-wrap gap-2">
                        <SprintStatusButton
                          sprintId={
                            sprint.id
                          }
                          status={
                            sprint.status
                          }
                          onUpdated={() =>
                            loadPageData(
                              true
                            )
                          }
                        />

                        <EditSprintDialog
                          sprint={sprint}
                          projects={
                            projects
                          }
                          users={users}
                          onUpdated={() =>
                            loadPageData(
                              true
                            )
                          }
                        />

                        <DeleteSprintDialog
                          sprintId={
                            sprint.id
                          }
                          sprintName={
                            sprint.name
                          }
                          taskCount={
                            sprint._count
                              ?.tasks ?? 0
                          }
                          status={
                            sprint.status
                          }
                          onDeleted={() =>
                            loadPageData(
                              true
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </>
    )}

    {!loading &&
      filteredSprints.length > 0 && (
        <div className="mt-5 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing{" "}
            {filteredSprints.length} of{" "}
            {sprints.length} sprints
          </span>

          <span>
            {statistics.tasks} total tasks
          </span>
        </div>
      )}
  </div>
</div>


);
}

function TableHeader({
children,
align = "left",
}: {
children: React.ReactNode;
align?: "left" | "right";
}) {
return (
<th
className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
>
{children} </th>
);
}

function StatCard({
title,
value,
icon: Icon,
}: {
title: string;
value: number;
icon: typeof Target;
}) {
return ( <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"> <div className="flex items-center justify-between gap-4"> <div> <p className="text-sm text-slate-500">
{title} </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>
    </div>

    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
      <Icon className="h-5 w-5 text-blue-400" />
    </div>
  </div>
</div>


);
}

function InfoItem({
icon: Icon,
label,
value,
}: {
icon: typeof FolderKanban;
label: string;
value: string;
}) {
return ( <div className="flex min-w-0 items-start gap-3"> <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />


  <div className="min-w-0">
    <p className="text-xs text-slate-600">
      {label}
    </p>

    <p className="mt-0.5 truncate text-sm text-slate-300">
      {value}
    </p>
  </div>
</div>


);
}

function LoadingState() {
return ( <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900"> <div className="flex flex-col items-center gap-3"> <Loader2 className="h-8 w-8 animate-spin text-blue-400" />


    <p className="text-sm text-slate-400">
      Loading sprints...
    </p>
  </div>
</div>


);
}

function EmptyState({
hasFilters,
canManage,
projects,
users,
onCreated,
}: {
hasFilters: boolean;
canManage: boolean;
projects: Project[];
users: User[];
onCreated: () => void;
}) {
return ( <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 px-6 text-center"> <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800"> <Target className="h-7 w-7 text-slate-500" /> </div>


  <h2 className="text-lg font-semibold text-white">
    No sprints found
  </h2>

  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
    {hasFilters
      ? "Try changing your search or filters."
      : canManage
      ? "Create your first sprint to start planning project work."
      : "There are no sprints available for your account."}
  </p>

  {!hasFilters && canManage && (
    <div className="mt-5">
      <CreateSprintDialog
        projects={projects}
        users={users}
        onCreated={onCreated}
      />
    </div>
  )}
</div>


);
}
