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

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

async function getTaskForUser(
  taskId: string,
  userId: string,
  userRole: string
) {
  const task = await db.task.findUnique({
    where: {
      id: taskId,
    },

    include: {
      project: {
        select: {
          id: true,
          name: true,
          key: true,
          status: true,
          ownerId: true,

          members: {
            select: {
              userId: true,
            },
          },
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

  if (!task) {
    return {
      task: null,
      authorized: false,
    };
  }

  if (userRole === "ADMIN") {
    return {
      task,
      authorized: true,
    };
  }

  const isOwner =
    task.project.ownerId === userId;

  const isMember =
    task.project.members.some(
      (member) => member.userId === userId
    );

  if (!isOwner && !isMember) {
    return {
      task,
      authorized: false,
    };
  }

  return {
    task,
    authorized: true,
  };
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Task ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result = await getTaskForUser(
      id,
      currentUser.user.id,
      currentUser.user.role
    );

    if (!result.task) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!result.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access this task.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,
      task: result.task,
    });
  } catch (error) {
    console.error(
      "Task GET error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch task.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Task ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result = await getTaskForUser(
      id,
      currentUser.user.id,
      currentUser.user.role
    );

    if (!result.task) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!result.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to edit this task.",
        },
        {
          status: 403,
        }
      );
    }

    const existingTask = result.task;

    /*
     * JSON PARSING
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
     *
     * در قرارداد فعلی Task PUT
     * title اجباری است.
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

    const normalizedTitle =
      title.trim();

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
     *
     * projectId باید ارسال شود
     * اما فقط مقدار اصلی Task معتبر است.
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

    if (
      normalizedProjectId !==
      existingTask.projectId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A task cannot be moved to another project.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * STATUS
     */
    const normalizedStatus =
      status === undefined ||
      status === null ||
      status === ""
        ? existingTask.status
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
        ? existingTask.priority
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
     * DESCRIPTION
     */
    let normalizedDescription:
      | string
      | null;

    if (description === undefined) {
      normalizedDescription =
        existingTask.description;
    } else if (
      description === null ||
      description === ""
    ) {
      normalizedDescription = null;
    } else {
      if (typeof description !== "string") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Task description must be a string or null.",
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
     */
    let normalizedAssigneeId:
      | string
      | null;

    if (assigneeId === undefined) {
      normalizedAssigneeId =
        existingTask.assigneeId;
    } else if (
      assigneeId === null ||
      assigneeId === ""
    ) {
      normalizedAssigneeId = null;
    } else {
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

      const normalizedAssignee =
        assigneeId.trim();

      if (!normalizedAssignee) {
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
            id: normalizedAssignee,
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
            id: existingTask.projectId,
            OR: [
              {
                ownerId:
                  normalizedAssignee,
              },
              {
                members: {
                  some: {
                    userId:
                      normalizedAssignee,
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

      normalizedAssigneeId =
        normalizedAssignee;
    }

    /*
     * SPRINT
     */
    let normalizedSprintId:
      | string
      | null;

    if (sprintId === undefined) {
      normalizedSprintId =
        existingTask.sprintId;
    } else if (
      sprintId === null ||
      sprintId === ""
    ) {
      normalizedSprintId = null;
    } else {
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

      const normalizedSprint =
        sprintId.trim();

      if (!normalizedSprint) {
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
            id: normalizedSprint,
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
        existingTask.projectId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Sprint does not belong to this project.",
          },
          {
            status: 400,
          }
        );
      }

      normalizedSprintId =
        sprint.id;
    }

    /*
     * DUE DATE
     */
    let parsedDueDate:
      | Date
      | null;

    if (dueDate === undefined) {
      parsedDueDate =
        existingTask.dueDate;
    } else if (
      dueDate === null ||
      dueDate === ""
    ) {
      parsedDueDate = null;
    } else {
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

      const normalizedDueDate =
        dueDate.trim();

      if (!normalizedDueDate) {
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

      const date =
        new Date(normalizedDueDate);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
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
     * UPDATE
     *
     * فقط فیلدهای مجاز وارد Prisma می‌شوند.
     *
     * projectId همیشه از existingTask گرفته می‌شود.
     *
     * ownerId
     * role
     * reporterId
     * createdAt
     * updatedAt
     *
     * و سایر فیلدهای ناشناخته
     * هرگز وارد update نمی‌شوند.
     */
    const task =
      await db.task.update({
        where: {
          id,
        },

        data: {
          title:
            normalizedTitle,

          description:
            normalizedDescription,

          status:
            normalizedStatus as TaskStatus,

          priority:
            normalizedPriority as IssuePriority,

          projectId:
            existingTask.projectId,

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

    return NextResponse.json({
      success: true,
      message:
        "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error(
      "Task PUT error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update task.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
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

    if (
      currentUser.user.role !==
        "ADMIN" &&
      currentUser.user.role !==
        "PROJECT_MANAGER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to delete tasks.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await getTaskForUser(
        id,
        currentUser.user.id,
        currentUser.user.role
      );

    if (!result.task) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!result.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to delete this task.",
        },
        {
          status: 403,
        }
      );
    }

    const task =
      await db.task.delete({
        where: {
          id,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Task deleted successfully.",
      task: {
        id: task.id,
      },
    });
  } catch (error) {
    console.error(
      "Task DELETE error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete task.",
      },
      {
        status: 500,
      }
    );
  }
}