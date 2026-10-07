import { NextResponse } from "next/server";
import { sql, initDb } from "./db";
import { getSession, createToken, COOKIE } from "./auth";

export const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Loads the logged-in user from the DB so role changes and disabling apply immediately.
export async function currentUser() {
  const session = await getSession();
  if (!session) return null;
  await initDb();
  const [user] = await sql`SELECT id, name, email, role, active FROM users WHERE id = ${session.id}`;
  return user?.active ? user : null;
}

export async function requireUser({ admin = false } = {}) {
  const user = await currentUser();
  if (!user) return { error: fail("Unauthorized", 401) };
  if (admin && user.role !== "admin") return { error: fail("Forbidden", 403) };
  return { user };
}

export async function loginResponse(user, status = 200) {
  const res = NextResponse.json({ id: user.id, name: user.name, role: user.role }, { status });
  res.cookies.set(COOKIE, await createToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");
export const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
