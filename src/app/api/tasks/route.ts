import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  TaskStatus,
  IssuePriority,
} from "@/generated/prisma/enums";

const VALID_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
];

const VALID_PRIORITIES: IssuePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

/**
 * GET /api/tasks
 *
 * فقط Taskهای پروژه‌هایی را برمی‌گرداند که کاربر
 * به آن‌ها دسترسی دارد.
 *
 * ADMIN:
 * دسترسی به همه پروژه‌ها
 *
 * سایر کاربران:
 * فقط Owner یا Member پروژه
 */
export async function GET() {
  try {
    const currentUser = await requireAuth();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const isAdmin =
      currentUser.user.role === "ADMIN";

    const tasks = await db.task.findMany({
      where: isAdmin
        ? undefined
        : {
            project: {
              OR: [
                {
                  ownerId: currentUser.user.id,
                },
                {
                  members: {
                    some: {
                      userId: currentUser.user.id,
                    },
                  },
                },
              ],
            },
          },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            status: true,
          },
        },

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error(
      "Tasks GET error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tasks.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/tasks
 *
 * ساخت Task فقط در پروژه‌ای که کاربر
 * اجازه دسترسی به آن را دارد.
 */
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * JSON BODY
     *
     * JSON خراب نباید باعث HTTP 500 شود.
     */
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * BODY TYPE
     *
     * فقط JSON Object مجاز است.
     *
     * null
     * array
     * string
     * number
     * boolean
     *
     * همگی رد می‌شوند.
     */
    if (
      body === null ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Request body must be a JSON object.",
        },
        {
          status: 400,
        }
      );
    }

    const data =
      body as Record<string, unknown>;

    const {
      title,
      description,
      status,
      priority,
      projectId,
      assigneeId,
      sprintId,
      dueDate,
    } = data;

    /*
     * TITLE
     */
    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Task title is required.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedTitle = title.trim();

    if (normalizedTitle.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task title cannot exceed 200 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * PROJECT ID
     */
    if (
      typeof projectId !== "string" ||
      !projectId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Project is required.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedProjectId =
      projectId.trim();

    /*
     * STATUS
     */
    const normalizedStatus =
      status === undefined ||
      status === null ||
      status === ""
        ? "TODO"
        : status;

    if (
      typeof normalizedStatus !== "string" ||
      !VALID_STATUSES.includes(
        normalizedStatus as TaskStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task status.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * PRIORITY
     */
    const normalizedPriority =
      priority === undefined ||
      priority === null ||
      priority === ""
        ? "MEDIUM"
        : priority;

    if (
      typeof normalizedPriority !== "string" ||
      !VALID_PRIORITIES.includes(
        normalizedPriority as IssuePriority
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task priority.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * PROJECT ACCESS
     *
     * ADMIN:
     * دسترسی به همه پروژه‌ها
     *
     * سایر کاربران:
     * باید Owner یا Member پروژه باشند.
     */
    const project = await db.project.findUnique({
      where: {
        id: normalizedProjectId,
      },

      select: {
        id: true,
        ownerId: true,

        members: {
          where: {
            userId: currentUser.user.id,
          },

          select: {
            userId: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found.",
        },
        {
          status: 404,
        }
      );
    }

    const isAdmin =
      currentUser.user.role === "ADMIN";

    const isOwner =
      project.ownerId === currentUser.user.id;

    const isMember =
      project.members.length > 0;

    if (!isAdmin && !isOwner && !isMember) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to create tasks in this project.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * DESCRIPTION
     */
    let normalizedDescription:
      | string
      | null = null;

    if (
      description !== undefined &&
      description !== null
    ) {
      if (typeof description !== "string") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Task description must be a string.",
          },
          {
            status: 400,
          }
        );
      }

      const trimmedDescription =
        description.trim();

      if (trimmedDescription.length > 5000) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Task description cannot exceed 5000 characters.",
          },
          {
            status: 400,
          }
        );
      }

      normalizedDescription =
        trimmedDescription || null;
    }

    /*
     * ASSIGNEE
     *
     * کاربر انتخاب‌شده باید عضو همین پروژه
     * یا Owner همین پروژه باشد.
     */
    let normalizedAssigneeId:
      | string
      | null = null;

    if (
      assigneeId !== undefined &&
      assigneeId !== null &&
      assigneeId !== ""
    ) {
      if (typeof assigneeId !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid assignee.",
          },
          {
            status: 400,
          }
        );
      }

      const assignee =
        await db.user.findUnique({
          where: {
            id: assigneeId,
          },

          select: {
            id: true,
          },
        });

      if (!assignee) {
        return NextResponse.json(
          {
            success: false,
            message: "Assignee not found.",
          },
          {
            status: 404,
          }
        );
      }

      const assigneeAccess =
        await db.project.findFirst({
          where: {
            id: normalizedProjectId,

            OR: [
              {
                ownerId: assigneeId,
              },
              {
                members: {
                  some: {
                    userId: assigneeId,
                  },
                },
              },
            ],
          },

          select: {
            id: true,
          },
        });

      if (!assigneeAccess) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Assignee does not belong to this project.",
          },
          {
            status: 400,
          }
        );
      }

      normalizedAssigneeId = assigneeId;
    }

    /*
     * SPRINT
     *
     * Sprint باید متعلق به همان Project باشد.
     */
    let normalizedSprintId:
      | string
      | null = null;

    if (
      sprintId !== undefined &&
      sprintId !== null &&
      sprintId !== ""
    ) {
      if (typeof sprintId !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid sprint.",
          },
          {
            status: 400,
          }
        );
      }

      const sprint =
        await db.sprint.findUnique({
          where: {
            id: sprintId,
          },

          select: {
            id: true,
            projectId: true,
          },
        });

      if (!sprint) {
        return NextResponse.json(
          {
            success: false,
            message: "Sprint not found.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        sprint.projectId !==
        normalizedProjectId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Sprint does not belong to the selected project.",
          },
          {
            status: 400,
          }
        );
      }

      normalizedSprintId = sprintId;
    }

    /*
     * DUE DATE
     */
    let parsedDueDate:
      | Date
      | null = null;

    if (
      dueDate !== undefined &&
      dueDate !== null &&
      dueDate !== ""
    ) {
      if (typeof dueDate !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid due date.",
          },
          {
            status: 400,
          }
        );
      }

      const date = new Date(dueDate);

      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid due date.",
          },
          {
            status: 400,
          }
        );
      }

      parsedDueDate = date;
    }

    /*
     * CREATE TASK
     */
    const task = await db.task.create({
      data: {
        title: normalizedTitle,

        description:
          normalizedDescription,

        status:
          normalizedStatus as TaskStatus,

        priority:
          normalizedPriority as IssuePriority,

        projectId:
          normalizedProjectId,

        assigneeId:
          normalizedAssigneeId,

        sprintId:
          normalizedSprintId,

        dueDate:
          parsedDueDate,
      },

      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            status: true,
          },
        },

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Task created successfully.",
        task,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Tasks POST error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create task.",
      },
      {
        status: 500,
      }
    );
  }
}