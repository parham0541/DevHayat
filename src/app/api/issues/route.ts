import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  IssuePriority,
  IssueStatus,
  IssueType,
} from "@/generated/prisma/enums";

const VALID_TYPES: IssueType[] = [
  "TASK",
  "BUG",
  "STORY",
];

const VALID_PRIORITIES: IssuePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const VALID_STATUSES: IssueStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

/**
 * GET /api/issues
 *
 * فقط Issueهای پروژه‌هایی را برمی‌گرداند
 * که کاربر به آن‌ها دسترسی دارد.
 *
 * ADMIN:
 * همه پروژه‌ها
 *
 * سایر کاربران:
 * Owner یا Member پروژه
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

    const issues = await db.issue.findMany({
      where: isAdmin
        ? undefined
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
          },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        priority: true,
        status: true,
        projectId: true,
        reporterId: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,

        project: {
          select: {
            id: true,
            name: true,
            key: true,
            status: true,
          },
        },

        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
      },
    });

    return NextResponse.json({
      success: true,
      issues,
    });
  } catch (error) {
    console.error(
      "Issues GET error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch issues.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/issues
 *
 * ساخت Issue فقط در پروژه‌ای که کاربر
 * به آن دسترسی دارد.
 *
 * reporterId از Client قبول نمی‌شود.
 * Reporter همیشه کاربر لاگین‌شده است.
 */
export async function POST(
  request: Request
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
      type,
      priority,
      status,
      projectId,
      assigneeId,
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
          message:
            "Issue title is required.",
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
            "Issue title cannot exceed 200 characters.",
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
      | null = null;

    if (
      description !== undefined &&
      description !== null
    ) {
      if (
        typeof description !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Issue description must be a string or null.",
          },
          {
            status: 400,
          }
        );
      }

      const trimmedDescription =
        description.trim();

      if (
        trimmedDescription.length >
        5000
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Issue description cannot exceed 5000 characters.",
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
     * PROJECT ID
     */
    if (
      typeof projectId !==
        "string" ||
      !projectId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project is required.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedProjectId =
      projectId.trim();

    /*
     * TYPE
     */
    const normalizedType =
      type === undefined ||
      type === null ||
      type === ""
        ? "TASK"
        : type;

    if (
      typeof normalizedType !==
        "string" ||
      !VALID_TYPES.includes(
        normalizedType as IssueType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid issue type.",
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
      typeof normalizedPriority !==
        "string" ||
      !VALID_PRIORITIES.includes(
        normalizedPriority as IssuePriority
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid issue priority.",
        },
        {
          status: 400,
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
        ? "TODO"
        : status;

    if (
      typeof normalizedStatus !==
        "string" ||
      !VALID_STATUSES.includes(
        normalizedStatus as IssueStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid issue status.",
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
     * همه پروژه‌ها
     *
     * سایر کاربران:
     * Owner یا Member
     */
    const project =
      await db.project.findUnique({
        where: {
          id: normalizedProjectId,
        },

        select: {
          id: true,
          ownerId: true,

          members: {
            where: {
              userId:
                currentUser.user.id,
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
          message:
            "Project not found.",
        },
        {
          status: 404,
        }
      );
    }

    const isAdmin =
      currentUser.user.role ===
      "ADMIN";

    const isOwner =
      project.ownerId ===
      currentUser.user.id;

    const isMember =
      project.members.length > 0;

    if (
      !isAdmin &&
      !isOwner &&
      !isMember
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to create issues in this project.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ASSIGNEE
     *
     * اگر Assignee مشخص شده باشد،
     * باید عضو همین پروژه یا Owner پروژه باشد.
     */
    let normalizedAssigneeId:
      | string
      | null = null;

    if (
      assigneeId !== undefined &&
      assigneeId !== null &&
      assigneeId !== ""
    ) {
      if (
        typeof assigneeId !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid assignee.",
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
            message:
              "Assignee not found.",
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
                ownerId:
                  assigneeId,
              },
              {
                members: {
                  some: {
                    userId:
                      assigneeId,
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
        assigneeId;
    }

    /*
     * CREATE ISSUE
     *
     * reporterId عمداً از body گرفته نمی‌شود.
     *
     * Reporter همیشه کاربر فعلی است.
     */
    const issue =
      await db.issue.create({
        data: {
          title:
            normalizedTitle,

          description:
            normalizedDescription,

          type:
            normalizedType as IssueType,

          priority:
            normalizedPriority as IssuePriority,

          status:
            normalizedStatus as IssueStatus,

          projectId:
            normalizedProjectId,

          reporterId:
            currentUser.user.id,

          assigneeId:
            normalizedAssigneeId,
        },

        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          priority: true,
          status: true,
          projectId: true,
          reporterId: true,
          assigneeId: true,
          createdAt: true,
          updatedAt: true,

          project: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },

          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Issue created successfully.",
        issue,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Issues POST error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create issue.",
      },
      {
        status: 500,
      }
    );
  }
}