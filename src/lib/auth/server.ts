import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export type SessionData = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
  };
};

/**
 * Get the current session from request headers.
 * Returns null if not authenticated.
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });
    return session as SessionData | null;
  } catch {
    return null;
  }
}

/**
 * Require authentication — returns session or JSON 401 response.
 */
export async function requireAuth(): Promise<
  { session: SessionData; error?: never } | { session?: never; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }
  return { session };
}

/**
 * Check if user is an admin.
 * For now, uses a simple email-based check.
 * In production, use a role-based system.
 */
export async function requireAdmin(): Promise<
  { session: SessionData; error?: never } | { session?: never; error: NextResponse }
> {
  const result = await requireAuth();
  if (result.error) return result;

  // Admin check: email contains "admin" or is in admin list
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  const isAdmin =
    result.session.user.email?.includes("admin") ||
    adminEmails.includes(result.session.user.email?.toLowerCase() || "");

  if (!isAdmin) {
    return {
      error: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      ),
    };
  }

  return result;
}
