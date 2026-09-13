import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";

const SESSION_COOKIE_NAME = "devhayat_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_SECONDS * 1000
  );

  await db.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return {
    expiresAt,
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await db.session.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await db.session.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  return {
    session,
    user: session.user,
  };
}

/**
 * Requires an authenticated user.
 *
 * Returns null if the user is not authenticated.
 */
export async function requireAuth() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  return currentUser;
}

/**
 * Requires an authenticated user with one of the specified roles.
 *
 * Returns:
 * - 401 if the user is not authenticated
 * - 403 if the user is authenticated but does not have permission
 * - 200 if the user has an allowed role
 */
export async function requireRole(roles: UserRole[]) {
  const currentUser = await requireAuth();

  if (!currentUser) {
    return {
      authorized: false,
      status: 401 as const,
      user: null,
    };
  }

  if (!roles.includes(currentUser.user.role)) {
    return {
      authorized: false,
      status: 403 as const,
      user: currentUser.user,
    };
  }

  return {
    authorized: true,
    status: 200 as const,
    user: currentUser.user,
  };
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);

    await db.session.deleteMany({
      where: {
        tokenHash,
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export { SESSION_COOKIE_NAME };