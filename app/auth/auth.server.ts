import { redirect } from "react-router";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "~/db/db.server";
import { getSession, commitSession, destroySession } from "./session.server";

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

/**
 * Verify credentials and return user if valid
 */
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  return user;
}

/**
 * Create a session cookie for the given user
 */
export async function createUserSession(
  user: AuthUser,
  redirectTo: string,
  request: Request
) {
  const session = await getSession(request);
  session.set("userId", user.id);
  session.set("role", user.role);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

/**
 * Get the current user from the session, or null if not logged in
 */
export async function getUser(request: Request): Promise<AuthUser | null> {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });

  return user;
}

/**
 * Require a logged-in user. Redirects to /admin/login if not authenticated.
 */
export async function requireUser(request: Request): Promise<AuthUser> {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/admin/login");
  }
  return user;
}

/**
 * Require an admin user. Redirects to /admin/login if not authenticated,
 * throws 403 if not admin.
 */
export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/admin/login");
  }
  if (user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

/**
 * Destroy the session and redirect to /admin/login
 */
export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/admin/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}


