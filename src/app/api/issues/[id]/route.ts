import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  IssuePriority,
  IssueStatus,
  IssueType,
} from "@/generated/prisma/enums";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
 * پیدا کردن Issue و بررسی دسترسی کاربر به پروژه آن
 *
 * ADMIN:
 * دسترسی کامل
 *
 * سایر کاربران:
 * Owner یا Member پروژه
 */
async function getIssueForUser(
  issueId: string,
  userId: string,
  userRole: string
) {
  const issue = await db.issue.findUnique({
    where: {
      id: issueId,
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
          ownerId: true,

          members: {
            select: {
              userId: true,
            },
          },
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

  if (!issue) {
    return {
      issue: null,
      authorized: false,
    };
  }

  if (userRole === "ADMIN") {
    return {
      issue,
      authorized: true,
    };
  }

  const isOwner =
    issue.project.ownerId === userId;

  const isMember =
    issue.project.members.some(
      (member) => member.userId === userId
    );

  if (!isOwner && !isMember) {
    return {
      issue,
      authorized: false,
    };
  }

  return {
    issue,
    authorized: true,
  };
}

/**
 * GET /api/issues/[id]
 *
 * فقط کاربرانی که به پروژه دسترسی دارند
 * می‌توانند Issue را مشاهده کنند.
 */
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
            "Issue ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await getIssueForUser(
        id,
        currentUser.user.id,
        currentUser.user.role
      );

    if (!result.issue) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Issue not found.",
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
            "You do not have permission to access this issue.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,
      issue: result.issue,
    });
  } catch (error) {
    console.error(
      "Issue GET error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch issue.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PUT /api/issues/[id]
 *
 * فقط کاربران مجاز پروژه می‌توانند
 * Issue را ویرایش کنند.
 *
 * reporterId از Client پذیرفته نمی‌شود.
 *
 * projectId نیز قابل تغییر نیست.
 */
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
            "Issue ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * پیدا کردن Issue + بررسی دسترسی
     */
    const result =
      await getIssueForUser(
        id,
        currentUser.user.id,
        currentUser.user.role
      );

    if (!result.issue) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Issue not found.",
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
            "You do not have permission to edit this issue.",
        },
        {
          status: 403,
        }
      );
    }

    const existingIssue =
      result.issue;

    /*
     * JSON Validation
     *
     * جلوگیری از HTTP 500 برای
     * JSON خراب یا malformed JSON
     */
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Body باید Object باشد
     *
     * Array و null قابل قبول نیستند.
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

    if (
      normalizedTitle.length > 200
    ) {
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
      | null;

    if (
      description === undefined
    ) {
      normalizedDescription =
        existingIssue.description;
    } else if (
      description === null ||
      description === ""
    ) {
      normalizedDescription =
        null;
    } else {
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
     *
     * Issue نمی‌تواند به پروژه دیگری
     * منتقل شود.
     */
    if (
      typeof projectId !== "string" ||
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

    if (
      normalizedProjectId !==
      existingIssue.projectId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An issue cannot be moved to another project.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * TYPE
     */
    const normalizedType =
      type === undefined ||
      type === null ||
      type === ""
        ? existingIssue.type
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
        ? existingIssue.priority
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
        ? existingIssue.status
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
     * ASSIGNEE
     *
     * Assignee باید عضو همین پروژه
     * یا Owner پروژه باشد.
     */
    let normalizedAssigneeId:
      | string
      | null;

    if (
      assigneeId === undefined
    ) {
      normalizedAssigneeId =
        existingIssue.assigneeId;
    } else if (
      assigneeId === null ||
      assigneeId === ""
    ) {
      normalizedAssigneeId =
        null;
    } else {
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
            id: existingIssue.projectId,

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
     * UPDATE
     *
     * reporterId عمداً تغییر نمی‌کند.
     *
     * projectId نیز از مقدار
     * existingIssue استفاده می‌کند.
     *
     * این کار جلوی Mass Assignment
     * و تغییر مالکیت منطقی Issue را می‌گیرد.
     */
    const issue =
      await db.issue.update({
        where: {
          id,
        },

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

          /*
           * پروژه ثابت می‌ماند.
           */
          projectId:
            existingIssue.projectId,

          /*
           * Reporter ثابت می‌ماند.
           */
          reporterId:
            existingIssue.reporterId,

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
      message:
        "Issue updated successfully.",
      issue,
    });
  } catch (error) {
    console.error(
      "Issue PUT error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update issue.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * DELETE /api/issues/[id]
 *
 * فقط ADMIN و PROJECT_MANAGER
 * اجازه حذف Issue دارند.
 */
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

    /*
     * Role Authorization
     */
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
            "You do not have permission to delete issues.",
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
            "Issue ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * بررسی وجود Issue و دسترسی
     */
    const result =
      await getIssueForUser(
        id,
        currentUser.user.id,
        currentUser.user.role
      );

    if (!result.issue) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Issue not found.",
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
            "You do not have permission to delete this issue.",
        },
        {
          status: 403,
        }
      );
    }

    const deletedIssue =
      await db.issue.delete({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Issue deleted successfully.",
      issue: {
        id: deletedIssue.id,
      },
    });
  } catch (error) {
    console.error(
      "Issue DELETE error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete issue.",
      },
      {
        status: 500,
      }
    );
  }
}