import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export async function GET() {
  try {
    const currentUser = await requireRole([
      UserRole.ADMIN,
      UserRole.PROJECT_MANAGER,
      UserRole.DEVELOPER,
      UserRole.DESIGNER,
      UserRole.MEMBER,
    ]);

    if (!currentUser.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            currentUser.status === 401
              ? "Authentication required."
              : "You are not authorized to view users.",
        },
        {
          status: currentUser.status,
        }
      );
    }

    const users = await db.user.findMany({
      orderBy: {
        createdAt: "asc",
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

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Users GET error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const auth = await requireRole([
      UserRole.ADMIN,
    ]);

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.status === 401
              ? "Authentication required."
              : "Only administrators can create user accounts.",
        },
        {
          status: auth.status,
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

    const name =
      typeof data.name === "string"
        ? data.name.trim()
        : "";

    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";

    const password =
      typeof data.password === "string"
        ? data.password
        : "";

    const role =
      typeof data.role === "string"
        ? data.role
        : "MEMBER";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Full name must be at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required.",
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

    if (
      !Object.values(UserRole).includes(
        role as UserRole
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user role.",
          allowedRoles:
            Object.values(UserRole),
        },
        {
          status: 400,
        }
      );
    }

    const existingUser =
      await db.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role as UserRole,
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

    return NextResponse.json(
      {
        success: true,
        message:
          "User account created successfully.",
        user,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Users POST error:",
      getErrorMessage(error)
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create user account.",
      },
      {
        status: 500,
      }
    );
  }
}
