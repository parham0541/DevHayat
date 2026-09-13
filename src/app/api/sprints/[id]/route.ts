import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const VALID_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
] as const;

type SprintStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(
  value: unknown
): value is SprintStatus {
  return (
    typeof value === "string" &&
    VALID_STATUSES.includes(
      value as SprintStatus
    )
  );
}

function parseDate(
  value: unknown
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

async function getSprintForUser(
  sprintId: string,
  userId: string,
  userRole: string
) {
  const sprint = await db.sprint.findUnique({
    where: {
      id: sprintId,
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

      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      tasks: {
        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,

          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },

      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  if (!sprint) {
    return {
      sprint: null,
      authorized: false,
    };
  }

  if (userRole === "ADMIN") {
    return {
      sprint,
      authorized: true,
    };
  }

  const isOwner =
    sprint.project.ownerId === userId;

  const isMember =
    sprint.project.members.some(
      (member) =>
        member.userId === userId
    );

  if (!isOwner && !isMember) {
    return {
      sprint,
      authorized: false,
    };
  }

  return {
    sprint,
    authorized: true,
  };
}

export async function GET(
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

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sprint ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await getSprintForUser(
        id,
        currentUser.user.id,
        currentUser.user.role
      );

    if (!result.sprint) {
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

    if (!result.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access this sprint.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,
      sprint: result.sprint,
    });
  } catch (error) {
    console.error(
      "Sprint GET error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch sprint.",
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

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sprint ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await getSprintForUser(
        id,
        currentUser.user.id,
        currentUser.user.role
      );

    if (!result.sprint) {
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

    if (!result.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to edit this sprint.",
        },
        {
          status: 403,
        }
      );
    }

    const existingSprint =
      result.sprint;

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
      name,
      goal,
      status,
      projectId,
      creatorId,
      startDate,
      endDate,
    } = data;

    if (creatorId !== undefined) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Creator cannot be changed.",
        },
        {
          status: 403,
        }
      );
    }

    if (projectId !== undefined) {
      if (
        typeof projectId !== "string" ||
        !projectId.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid project ID.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        projectId.trim() !==
        existingSprint.projectId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A sprint cannot be moved to another project.",
          },
          {
            status: 403,
          }
        );
      }
    }

    const updateData: {
      name?: string;
      goal?: string | null;
      status?: SprintStatus;
      startDate?: Date | null;
      endDate?: Date | null;
    } = {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Sprint name is required.",
          },
          {
            status: 400,
          }
        );
      }

      const trimmedName =
        name.trim();

      if (
        trimmedName.length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Sprint name must be 100 characters or less.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.name =
        trimmedName;
    }

    if (goal !== undefined) {
      if (
        goal === null ||
        goal === ""
      ) {
        updateData.goal = null;
      } else if (
        typeof goal === "string"
      ) {
        const trimmedGoal =
          goal.trim();

        if (
          trimmedGoal.length > 1000
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Sprint goal must be 1000 characters or less.",
            },
            {
              status: 400,
            }
          );
        }

        updateData.goal =
          trimmedGoal || null;
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              "Goal must be a string or null.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid sprint status.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.status =
        status;
    }

    const parsedStartDate =
      parseDate(startDate);

    const parsedEndDate =
      parseDate(endDate);

    if (
      startDate !== undefined &&
      parsedStartDate === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid start date.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      endDate !== undefined &&
      parsedEndDate === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid end date.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      startDate !== undefined
    ) {
      updateData.startDate =
        parsedStartDate ?? null;
    }

    if (
      endDate !== undefined
    ) {
      updateData.endDate =
        parsedEndDate ?? null;
    }

    const finalStartDate =
      startDate !== undefined
        ? parsedStartDate
        : existingSprint.startDate;

    const finalEndDate =
      endDate !== undefined
        ? parsedEndDate
        : existingSprint.endDate;

    if (
      finalStartDate &&
      finalEndDate &&
      finalStartDate > finalEndDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Start date cannot be later than end date.",
        },
        {
          status: 400,
        }
      );
    }

    const finalStatus =
      status !== undefined
        ? status
        : existingSprint.status;

    if (
      finalStatus === "ACTIVE"
    ) {
      const activeSprint =
        await db.sprint.findFirst({
          where: {
            projectId:
              existingSprint.projectId,

            status: "ACTIVE",

            NOT: {
              id,
            },
          },

          select: {
            id: true,
            name: true,
          },
        });

      if (activeSprint) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Project already has an active sprint: ${activeSprint.name}`,
          },
          {
            status: 409,
          }
        );
      }
    }

    if (
      Object.keys(updateData).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid fields were provided for update.",
        },
        {
          status: 400,
        }
      );
    }

    const sprint =
      await db.sprint.update({
        where: {
          id,
        },

        data: updateData,

        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true,
              status: true,
            },
          },

          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },

          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Sprint updated successfully.",
      sprint,
    });
  } catch (error) {
    console.error(
      "Sprint PUT error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update sprint.",
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
            "You do not have permission to delete sprints.",
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
            "Sprint ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await getSprintForUser(
        id,
        currentUser.user.id,
        currentUser.user.role
      );

    if (!result.sprint) {
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

    if (!result.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to delete this sprint.",
        },
        {
          status: 403,
        }
      );
    }

    const sprint =
      result.sprint;

    if (sprint.status === "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Active sprints cannot be deleted.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      sprint._count.tasks > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sprint cannot be deleted because it contains tasks.",
        },
        {
          status: 409,
        }
      );
    }

    await db.sprint.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Sprint deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Sprint DELETE error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete sprint.",
      },
      {
        status: 500,
      }
    );
  }
}