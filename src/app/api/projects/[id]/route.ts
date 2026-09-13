import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ProjectStatus } from "@/generated/prisma/enums";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const PROJECT_STATUSES: ProjectStatus[] = [
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

async function getProjectForUser(
  projectId: string,
  userId: string,
  userRole: string
) {
  const project = await db.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          issues: true,
          tasks: true,
          sprints: true,
        },
      },
    },
  });

  if (!project) {
    return {
      project: null,
      authorized: false,
    };
  }

  if (userRole === "ADMIN") {
    return {
      project,
      authorized: true,
    };
  }

  const isOwner = project.ownerId === userId;

  const isMember = project.members.some(
    (member) => member.userId === userId
  );

  if (!isOwner && !isMember) {
    return {
      project,
      authorized: false,
    };
  }

  return {
    project,
    authorized: true,
  };
}

/**
 * GET /api/projects/[id]
 *
 * Access:
 * - ADMIN: allowed
 * - Project owner: allowed
 * - Project member: allowed
 * - Other authenticated users: forbidden
 * - Unauthenticated users: unauthorized
 */
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
          message: "Project ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result = await getProjectForUser(
      id,
      currentUser.user.id,
      currentUser.user.role
    );

    if (!result.project) {
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

    if (!result.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access this project.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,
      project: result.project,
    });
  } catch (error) {
    console.error(
      "Project GET API error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch project.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PUT /api/projects/[id]
 *
 * Access:
 * - ADMIN: allowed
 * - PROJECT_MANAGER who owns/is member: allowed
 * - Other roles: forbidden
 *
 * Update is partial:
 * - At least one valid field must be provided.
 * - ownerId cannot be changed.
 * - Unknown fields are ignored.
 */
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
          message: "Project ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result = await getProjectForUser(
      id,
      currentUser.user.id,
      currentUser.user.role
    );

    if (!result.project) {
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

    if (!result.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access this project.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      currentUser.user.role !== "ADMIN" &&
      currentUser.user.role !== "PROJECT_MANAGER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to edit projects.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * JSON PARSING
     *
     * Invalid JSON must return 400 instead of 500.
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
     * Body must be a JSON object.
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

    const data = body as Record<string, unknown>;

    const updateData: {
      name?: string;
      key?: string;
      description?: string | null;
      status?: ProjectStatus;
      progress?: number;
    } = {};

    /*
     * NAME
     */
    if (data.name !== undefined) {
      if (typeof data.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Project name must be a string.",
          },
          {
            status: 400,
          }
        );
      }

      const name = data.name.trim();

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "Project name cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      if (name.length > 200) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Project name must be 200 characters or less.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.name = name;
    }

    /*
     * PROJECT KEY
     */
    if (data.key !== undefined) {
      if (typeof data.key !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Project key must be a string.",
          },
          {
            status: 400,
          }
        );
      }

      const key = data.key.trim().toUpperCase();

      if (!key) {
        return NextResponse.json(
          {
            success: false,
            message: "Project key cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      if (key.length < 2 || key.length > 10) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Project key must be between 2 and 10 characters.",
          },
          {
            status: 400,
          }
        );
      }

      if (!/^[A-Z0-9_-]+$/.test(key)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Project key can only contain letters, numbers, hyphens and underscores.",
          },
          {
            status: 400,
          }
        );
      }

      const existingProject =
        await db.project.findFirst({
          where: {
            key,
            NOT: {
              id,
            },
          },
          select: {
            id: true,
          },
        });

      if (existingProject) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A project with this key already exists.",
          },
          {
            status: 409,
          }
        );
      }

      updateData.key = key;
    }

    /*
     * DESCRIPTION
     */
    if (data.description !== undefined) {
      if (
        data.description !== null &&
        typeof data.description !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Project description must be a string or null.",
          },
          {
            status: 400,
          }
        );
      }

      const description =
        typeof data.description === "string"
          ? data.description.trim()
          : null;

      if (
        description !== null &&
        description.length > 5000
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Project description must be 5000 characters or less.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.description = description || null;
    }

    /*
     * STATUS
     */
    if (data.status !== undefined) {
      if (typeof data.status !== "string") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Project status must be a valid string.",
          },
          {
            status: 400,
          }
        );
      }

      const status =
        data.status.trim().toUpperCase();

      if (
        !PROJECT_STATUSES.includes(
          status as ProjectStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid project status.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.status = status as ProjectStatus;
    }

    /*
     * PROGRESS
     */
    if (data.progress !== undefined) {
      if (
        typeof data.progress !== "number" ||
        !Number.isInteger(data.progress) ||
        !Number.isFinite(data.progress)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Progress must be an integer between 0 and 100.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        data.progress < 0 ||
        data.progress > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Progress must be an integer between 0 and 100.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.progress = data.progress;
    }

    /*
     * EMPTY UPDATE
     *
     * Unknown fields such as:
     *
     * ownerId
     * role
     * createdAt
     * updatedAt
     *
     * are intentionally ignored.
     *
     * Therefore a request containing only unknown
     * fields must not perform an update.
     */
    if (Object.keys(updateData).length === 0) {
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

    /*
     * SECURITY
     *
     * ownerId is intentionally NOT accepted.
     *
     * The client cannot change:
     *
     * {
     *   "ownerId": "another-user-id"
     * }
     *
     * Unknown fields are never passed into Prisma.
     */
    const updatedProject = await db.project.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            issues: true,
            tasks: true,
            sprints: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project updated successfully.",
      project: updatedProject,
    });
  } catch (error) {
    console.error(
      "Project PUT API error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update project.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 *
 * Only ADMIN can delete projects.
 */
export async function DELETE(
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

    if (currentUser.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only administrators can delete projects.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const project = await db.project.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
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

    await db.project.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully.",
      project: {
        id: project.id,
        name: project.name,
      },
    });
  } catch (error) {
    console.error(
      "Project DELETE API error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete project.",
      },
      {
        status: 500,
      }
    );
  }
}