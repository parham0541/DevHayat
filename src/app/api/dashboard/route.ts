import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export async function GET() {
  try {
    const currentUser =
      await requireAuth();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const isAdmin =
      currentUser.user.role === "ADMIN";

    /*
     * ADMIN:
     * Access to all projects.
     *
     * Other users:
     * Only projects they own or belong to.
     */
    const projectAccessWhere = isAdmin
      ? {}
      : {
          OR: [
            {
              ownerId:
                currentUser.user.id,
            },
            {
              members: {
                some: {
                  userId:
                    currentUser.user.id,
                },
              },
            },
          ],
        };

    /*
     * All Task / Issue / Sprint queries
     * use the same project access scope.
     */
    const projectScopedWhere = isAdmin
      ? {}
      : {
          project: {
            OR: [
              {
                ownerId:
                  currentUser.user.id,
              },
              {
                members: {
                  some: {
                    userId:
                      currentUser.user.id,
                  },
                },
              },
            ],
          },
        };

    const [
      totalProjects,
      activeProjects,
      completedProjects,

      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,

      totalIssues,
      openIssues,
      resolvedIssues,

      totalSprints,
      plannedSprints,
      activeSprints,
      completedSprints,

      recentIssues,
      recentTasks,
      activeSprint,

      projects,
    ] = await Promise.all([
      /*
       * PROJECT STATISTICS
       */

      db.project.count({
        where:
          projectAccessWhere,
      }),

      db.project.count({
        where: {
          AND: [
            projectAccessWhere,
            {
              status: "ACTIVE",
            },
          ],
        },
      }),

      db.project.count({
        where: {
          AND: [
            projectAccessWhere,
            {
              status: "COMPLETED",
            },
          ],
        },
      }),

      /*
       * TASK STATISTICS
       */

      db.task.count({
        where:
          projectScopedWhere,
      }),

      db.task.count({
        where: {
          AND: [
            projectScopedWhere,
            {
              status: "TODO",
            },
          ],
        },
      }),

      db.task.count({
        where: {
          AND: [
            projectScopedWhere,
            {
              status: "IN_PROGRESS",
            },
          ],
        },
      }),

      db.task.count({
        where: {
          AND: [
            projectScopedWhere,
            {
              status: "COMPLETED",
            },
          ],
        },
      }),

      /*
       * ISSUE STATISTICS
       */

      db.issue.count({
        where:
          projectScopedWhere,
      }),

      db.issue.count({
        where: {
          AND: [
            projectScopedWhere,
            {
              status: {
                in: [
                  "TODO",
                  "IN_PROGRESS",
                ],
              },
            },
          ],
        },
      }),

      db.issue.count({
        where: {
          AND: [
            projectScopedWhere,
            {
              status: "DONE",
            },
          ],
        },
      }),

      /*
       * SPRINT STATISTICS
       */

      db.sprint.count({
        where:
          projectScopedWhere,
      }),

      db.sprint.count({
        where: {
          AND: [
            projectScopedWhere,
            {
              status: "PLANNED",
            },
          ],
        },
      }),

      db.sprint.count({
        where: {
          AND: [
            projectScopedWhere,
            {
              status: "ACTIVE",
            },
          ],
        },
      }),

      db.sprint.count({
        where: {
          AND: [
            projectScopedWhere,
            {
              status: "COMPLETED",
            },
          ],
        },
      }),

      /*
       * RECENT ISSUES
       */

      db.issue.findMany({
        where:
          projectScopedWhere,

        orderBy: {
          createdAt: "desc",
        },

        take: 5,

        select: {
          id: true,
          title: true,
          type: true,
          priority: true,
          status: true,
          createdAt: true,

          project: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },

          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),

      /*
       * RECENT TASKS
       */

      db.task.findMany({
        where:
          projectScopedWhere,

        orderBy: {
          createdAt: "desc",
        },

        take: 5,

        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,

          project: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },

          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          sprint: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      }),

      /*
       * ACTIVE SPRINT
       *
       * Only an active sprint from a project
       * the current user can access.
       */

      db.sprint.findFirst({
        where: {
          AND: [
            projectScopedWhere,
            {
              status: "ACTIVE",
            },
          ],
        },

        orderBy: {
          startDate: "asc",
        },

        select: {
          id: true,
          name: true,
          goal: true,
          status: true,
          startDate: true,
          endDate: true,

          project: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },

          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          _count: {
            select: {
              tasks: true,
            },
          },
        },
      }),

      /*
       * ACCESSIBLE PROJECTS
       */

      db.project.findMany({
        where:
          projectAccessWhere,

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          name: true,
          key: true,
          status: true,
          progress: true,

          _count: {
            select: {
              tasks: true,
              issues: true,
              sprints: true,
              members: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,

      statistics: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed:
            completedProjects,
        },

        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress:
            inProgressTasks,
          completed:
            completedTasks,
        },

        issues: {
          total: totalIssues,
          open: openIssues,
          resolved:
            resolvedIssues,
        },

        sprints: {
          total: totalSprints,
          planned:
            plannedSprints,
          active:
            activeSprints,
          completed:
            completedSprints,
        },
      },

      recentIssues,
      recentTasks,
      activeSprint,
      projects,
    });
  } catch (error) {
    console.error(
      "Dashboard GET error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch dashboard data.",
      },
      {
        status: 500,
      }
    );
  }
}