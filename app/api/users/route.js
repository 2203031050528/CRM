import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { requireUser, fail, normalizeEmail, validEmail } from "@/lib/session";
import { ROLES } from "@/lib/constants";

export async function GET() {
  const { error } = await requireUser({ admin: true });
  if (error) return error;
  const users = await sql`SELECT u.id, u.name, u.email, u.role, u.active, u.created_at,
      (SELECT COUNT(*)::int FROM contacts WHERE owner_id = u.id) AS contacts,
      (SELECT COUNT(*)::int FROM deals WHERE owner_id = u.id) AS deals,
      (SELECT COUNT(*)::int FROM tasks WHERE owner_id = u.id AND NOT done) AS open_tasks
    FROM users u ORDER BY u.id`;
  return NextResponse.json(users);
}

export async function POST(req) {
  const { error } = await requireUser({ admin: true });
  if (error) return error;
  const { name, email, password, role } = await req.json();
  const cleanEmail = normalizeEmail(email);
  if (!name?.trim()) return fail("Name is required");
  if (!validEmail(cleanEmail)) return fail("Enter a valid email");
  if (!password || password.length < 6) return fail("Password must be at least 6 characters");
  if (!ROLES.includes(role)) return fail("Invalid role");
  const [exists] = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`;
  if (exists) return fail("Email already exists", 409);
  const [user] = await sql`INSERT INTO users (name, email, password, role)
    VALUES (${name.trim()}, ${cleanEmail}, ${await bcrypt.hash(password, 10)}, ${role})
    RETURNING id, name, email, role, active, created_at`;
  return NextResponse.json(user, { status: 201 });
}
