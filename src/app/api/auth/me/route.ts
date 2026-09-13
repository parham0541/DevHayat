import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          user: null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: currentUser.user,
    });
  } catch (error) {
    console.error("Auth Me API error:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        user: null,
      },
      { status: 500 }
    );
  }
}