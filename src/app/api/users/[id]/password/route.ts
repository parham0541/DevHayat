import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

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

export async function POST(
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
              : "Administrator access required.",
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } = await context.params;

    if (!id) {
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

    if (id === auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot change your own password from user management.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    const confirmPassword =
      typeof body?.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "New password is required.",
        },
        {
          status: 400,
        }
      );
    }

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

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Passwords do not match.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await db.user.findUnique({
      where: {
        id,
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

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordHash,
        },
      });

      await tx.session.deleteMany({
        where: {
          userId: user.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        "User password changed successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Admin change user password error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to change user password.",
      },
      {
        status: 500,
      }
    );
  }
}
