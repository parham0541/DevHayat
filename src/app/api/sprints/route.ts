import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

const VALID_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
] as const;

type SprintStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is SprintStatus {
  return (
    typeof value === "string" &&
    VALID_STATUSES.includes(value as SprintStatus)
  );
}

function parseDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

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

    const isAdmin = currentUser.user.role === "ADMIN";

    const sprints = await db.sprint.findMany({
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
      sprints,
    });
  } catch (error) {
    console.error(
      "Sprints GET error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sprints.",
      },
      {
        status: 500,
      }
    );
  }
}

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
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Request body must be a JSON object.",
        },
        {
          status: 400,
        }
      );
    }

    const data = body as Record<string, unknown>;

    const name =
      typeof data.name === "string"
        ? data.name.trim()
        : "";

    let goal: string | null = null;

    if (
      data.goal !== undefined &&
      data.goal !== null
    ) {
      if (typeof data.goal !== "string") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Sprint goal must be a string or null.",
          },
          {
            status: 400,
          }
        );
      }

      goal = data.goal.trim();
    }

    const projectId =
      typeof data.projectId === "string"
        ? data.projectId.trim()
        : "";

    const status =
      data.status ?? "PLANNED";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Sprint name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > 100) {
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

    if (goal !== null && goal.length > 1000) {
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

    if (!projectId) {
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

    if (!isValidStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sprint status.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Never trust creatorId from the client.
     * The creator is always the authenticated user.
     */

    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },

      select: {
        id: true,
        ownerId: true,

        members: {
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
      project.members.some(
        (member) =>
          member.userId === currentUser.user.id
      );

    if (!isAdmin && !isOwner && !isMember) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to create a sprint for this project.",
        },
        {
          status: 403,
        }
      );
    }

    const startDate = parseDate(
      data.startDate
    );

    const endDate = parseDate(
      data.endDate
    );

    if (
      data.startDate !== undefined &&
      data.startDate !== null &&
      data.startDate !== "" &&
      !startDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid start date.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      data.endDate !== undefined &&
      data.endDate !== null &&
      data.endDate !== "" &&
      !endDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid end date.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Start date cannot be after end date.",
        },
        {
          status: 400,
        }
      );
    }

    if (status === "ACTIVE") {
      const activeSprint =
        await db.sprint.findFirst({
          where: {
            projectId,
            status: "ACTIVE",
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

    const sprint = await db.sprint.create({
      data: {
        name,
        goal,
        status,
        projectId,

        /*
         * Creator comes from the authenticated
         * session, never from request body.
         */
        creatorId: currentUser.user.id,

        startDate,
        endDate,
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

    return NextResponse.json(
      {
        success: true,
        message: "Sprint created successfully.",
        sprint,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Sprints POST error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create sprint.",
      },
      {
        status: 500,
      }
    );
  }
}