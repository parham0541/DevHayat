import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
    userId: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      id: projectId,
      userId,
    } = await context.params;

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
              : "Only administrators and project managers can remove members.",
        },
        { status: auth.status }
      );
    }

    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        ownerId: true,
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

    if (project.ownerId === userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The project owner cannot be removed from the project.",
        },
        { status: 400 }
      );
    }

    const membership =
      await db.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
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
      });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This user is not a member of the project.",
        },
        { status: 404 }
      );
    }

    await db.projectMember.delete({
      where: {
        id: membership.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully.",
      userId,
    });
  } catch (error) {
    console.error(
      "Remove project member error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove project member.",
      },
      { status: 500 }
    );
  }
}
