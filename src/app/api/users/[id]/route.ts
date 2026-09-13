import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireAuth();

    if (!auth) {
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
    const userId = id.trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "User GET error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load user profile.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireRole([
      UserRole.ADMIN,
    ]);

    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.status === 401
              ? "Authentication required."
              : "Only administrators can manage users.",
        },
        {
          status: auth.status,
        }
      );
    }

    const currentUserId = auth.user.id;

    const { id } = await context.params;
    const userId = id.trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (userId === currentUserId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot modify your own account from this page.",
        },
        {
          status: 400,
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
          message: "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const requestBody = body as {
      role?: unknown;
      password?: unknown;
    };

    const hasRole =
      requestBody.role !== undefined;

    const hasPassword =
      requestBody.password !== undefined;

    if (!hasRole && !hasPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role or password is required.",
        },
        {
          status: 400,
        }
      );
    }

    const existingUser =
      await db.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    const updateData: Prisma.UserUpdateInput =
      {};

    let passwordChanged = false;
    let roleChanged = false;

    if (hasRole) {
      if (
        typeof requestBody.role !== "string" ||
        !Object.values(UserRole).includes(
          requestBody.role as UserRole
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid user role.",
          },
          {
            status: 400,
          }
        );
      }

      const newRole =
        requestBody.role as UserRole;

      if (newRole !== existingUser.role) {
        updateData.role = newRole;
        roleChanged = true;
      }
    }

    if (hasPassword) {
      if (
        typeof requestBody.password !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Password must be a string.",
          },
          {
            status: 400,
          }
        );
      }

      const password =
        requestBody.password;

      if (password.length < 8) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Password must be at least 8 characters.",
          },
          {
            status: 400,
          }
        );
      }

      if (password.length > 128) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Password must not exceed 128 characters.",
          },
          {
            status: 400,
          }
        );
      }

      const passwordHash =
        await bcrypt.hash(password, 12);

      updateData.passwordHash =
        passwordHash;

      passwordChanged = true;
    }

    if (
      !roleChanged &&
      !passwordChanged
    ) {
      return NextResponse.json({
        success: true,
        message:
          "No changes were made.",
        user: existingUser,
      });
    }

    const updatedUser =
      await db.user.update({
        where: {
          id: userId,
        },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (passwordChanged) {
      await db.session.deleteMany({
        where: {
          userId,
        },
      });
    }

    let message =
      "User updated successfully.";

    if (
      roleChanged &&
      passwordChanged
    ) {
      message =
        "User role and password updated successfully.";
    } else if (roleChanged) {
      message =
        "User role updated successfully.";
    } else if (passwordChanged) {
      message =
        "User password changed successfully.";
    }

    return NextResponse.json({
      success: true,
      message,
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "User PATCH error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireRole([
      UserRole.ADMIN,
    ]);

    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.status === 401
              ? "Authentication required."
              : "Only administrators can delete users.",
        },
        {
          status: auth.status,
        }
      );
    }

    const currentUserId = auth.user.id;

    const { id } = await context.params;
    const userId = id.trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (userId === currentUserId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot delete your own account.",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await db.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.project.updateMany({
        where: {
          ownerId: userId,
        },
        data: {
          ownerId: currentUserId,
        },
      });

      await tx.issue.updateMany({
        where: {
          reporterId: userId,
        },
        data: {
          reporterId: currentUserId,
        },
      });

      await tx.sprint.updateMany({
        where: {
          creatorId: userId,
        },
        data: {
          creatorId: currentUserId,
        },
      });

      await tx.task.updateMany({
        where: {
          assigneeId: userId,
        },
        data: {
          assigneeId: null,
        },
      });

      await tx.issue.updateMany({
        where: {
          assigneeId: userId,
        },
        data: {
          assigneeId: null,
        },
      });

      await tx.projectMember.deleteMany({
        where: {
          userId,
        },
      });

      await tx.session.deleteMany({
        where: {
          userId,
        },
      });

      await tx.user.delete({
        where: {
          id: userId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.name} was permanently deleted.`,
    });
  } catch (error) {
    console.error(
      "User DELETE error:",
      getErrorMessage(error)
    );

    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The user could not be deleted because of a database constraint.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete user.",
      },
      {
        status: 500,
      }
    );
  }
}
