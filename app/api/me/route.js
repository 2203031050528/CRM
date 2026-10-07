import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { requireUser, fail } from "@/lib/session";

export async function GET() {
  const { user, error } = await requireUser();
  return error || NextResponse.json(user);
}

// Update own name and/or password (current password required to change it).
export async function PATCH(req) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { name, currentPassword, newPassword } = await req.json();
  if (name !== undefined) {
    if (!name.trim()) return fail("Name is required");
    await sql`UPDATE users SET name = ${name.trim()} WHERE id = ${user.id}`;
  }
  if (newPassword) {
    if (newPassword.length < 6) return fail("New password must be at least 6 characters");
    const [row] = await sql`SELECT password FROM users WHERE id = ${user.id}`;
    if (!(await bcrypt.compare(currentPassword || "", row.password))) return fail("Current password is incorrect");
    await sql`UPDATE users SET password = ${await bcrypt.hash(newPassword, 10)} WHERE id = ${user.id}`;
  }
  const [updated] = await sql`SELECT id, name, email, role FROM users WHERE id = ${user.id}`;
  return NextResponse.json(updated);
}
