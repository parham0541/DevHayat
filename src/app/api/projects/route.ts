import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ProjectStatus } from "@/generated/prisma/enums";

export async function GET() {
  try {
    const currentUser = await requireAuth();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const isAdmin = currentUser.user.role === "ADMIN";

    const projects = await db.project.findMany({
      where: isAdmin
        ? undefined
        : {
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

      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Projects GET API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch projects.",
      },
      { status: 500 }
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
        { status: 401 }
      );
    }

    const allowedRoles = ["ADMIN", "PROJECT_MANAGER"];

    if (!allowedRoles.includes(currentUser.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to create projects.",
        },
        { status: 403 }
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
        { status: 400 }
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
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const name =
      typeof data.name === "string"
        ? data.name.trim()
        : "";

    const key =
      typeof data.key === "string"
        ? data.key.trim().toUpperCase()
        : "";

    const description =
      typeof data.description === "string"
        ? data.description.trim()
        : "";

    const status =
      data.status === undefined
        ? "ACTIVE"
        : data.status;

    const progress =
      data.progress === undefined
        ? 0
        : data.progress;

    if (data.name !== undefined && typeof data.name !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Project name must be a string.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Project name is required.",
        },
        { status: 400 }
      );
    }

    if (name.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "Project name must be 200 characters or less.",
        },
        { status: 400 }
      );
    }

    if (data.key !== undefined && typeof data.key !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Project key must be a string.",
        },
        { status: 400 }
      );
    }

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          message: "Project key is required.",
        },
        { status: 400 }
      );
    }

    if (key.length < 2 || key.length > 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Project key must be between 2 and 10 characters.",
        },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9_-]+$/.test(key)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project key can only contain letters, numbers, hyphens and underscores.",
        },
        { status: 400 }
      );
    }

    if (
      data.description !== undefined &&
      typeof data.description !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Project description must be a string.",
        },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project description must be 5000 characters or less.",
        },
        { status: 400 }
      );
    }

    if (status === null || typeof status !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Project status must be a valid string.",
        },
        { status: 400 }
      );
    }

    if (
      !Object.values(ProjectStatus).includes(
        status as ProjectStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project status.",
        },
        { status: 400 }
      );
    }

    if (
      typeof progress !== "number" ||
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Progress must be an integer between 0 and 100.",
        },
        { status: 400 }
      );
    }

    const existingProject = await db.project.findUnique({
      where: {
        key,
      },

      select: {
        id: true,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          success: false,
          message: "A project with this key already exists.",
        },
        { status: 409 }
      );
    }

    const project = await db.project.create({
      data: {
        name,
        key,
        description: description || null,
        status: status as ProjectStatus,
        progress,

        ownerId: currentUser.user.id,

        members: {
          create: {
            userId: currentUser.user.id,
          },
        },
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

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully.",
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Projects POST API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create project.",
      },
      { status: 500 }
    );
  }
}