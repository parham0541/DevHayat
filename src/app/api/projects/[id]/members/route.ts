import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id: projectId } = await context.params;

    const auth = await requireRole([
      UserRole.ADMIN,
      UserRole.PROJECT_MANAGER,
      UserRole.DEVELOPER,
      UserRole.DESIGNER,
      UserRole.MEMBER,
    ]);

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.status === 401
              ? "Authentication required."
              : "You are not authorized to access this project.",
        },
        { status: auth.status }
      );
    }

    const currentUser = auth.user;

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found.",
        },
        { status: 404 }
      );
    }

    const membership = await db.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: currentUser.id,
          projectId,
        },
      },
    });

    const isAdmin =
      currentUser.role === UserRole.ADMIN;

    if (!isAdmin && !membership) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not a member of this project.",
        },
        { status: 403 }
      );
    }

    const members = await db.projectMember.findMany({
      where: {
        projectId,
      },
      orderBy: {
        joinedAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error(
      "Get project members error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load project members.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id: projectId } = await context.params;

    const auth = await requireRole([
      UserRole.ADMIN,
      UserRole.PROJECT_MANAGER,
    ]);

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.status === 401
              ? "Authentication required."
              : "Only administrators and project managers can add members.",
        },
        { status: auth.status }
      );
    }

    const currentUser = auth.user;

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      typeof body.userId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid userId is required.",
        },
        { status: 400 }
      );
    }

    const userId = body.userId.trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID cannot be empty.",
        },
        { status: 400 }
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
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    const existingMembership =
      await db.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This user is already a member of the project.",
        },
        { status: 409 }
      );
    }

    const member = await db.projectMember.create({
      data: {
        userId,
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Member added successfully.",
        member,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Add project member error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add project member.",
      },
      { status: 500 }
    );
  }
}