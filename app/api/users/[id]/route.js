import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { requireUser, fail } from "@/lib/session";
import { ROLES } from "@/lib/constants";

async function target(params) {
  const id = Number((await params).id);
  const [u] = await sql`SELECT id FROM users WHERE id = ${id}`;
  return u;
}

// Admin: change role, enable/disable, rename or reset a user's password.
export async function PATCH(req, { params }) {
  const { user: me, error } = await requireUser({ admin: true });
  if (error) return error;
  const u = await target(params);
  if (!u) return fail("Not found", 404);
  const { role, active, name, password } = await req.json();
  const self = u.id === me.id;
  if (role !== undefined) {
    if (!ROLES.includes(role)) return fail("Invalid role");
    if (self && role !== "admin") return fail("You cannot remove your own admin role");
    await sql`UPDATE users SET role = ${role} WHERE id = ${u.id}`;
  }
  if (active !== undefined) {
    if (self && !active) return fail("You cannot disable your own account");
    await sql`UPDATE users SET active = ${!!active} WHERE id = ${u.id}`;
  }
  if (name !== undefined) {
    if (!name.trim()) return fail("Name is required");
    await sql`UPDATE users SET name = ${name.trim()} WHERE id = ${u.id}`;
  }
  if (password !== undefined) {
    if (password.length < 6) return fail("Password must be at least 6 characters");
    await sql`UPDATE users SET password = ${await bcrypt.hash(password, 10)} WHERE id = ${u.id}`;
  }
  const [updated] = await sql`SELECT id, name, email, role, active, created_at FROM users WHERE id = ${u.id}`;
  return NextResponse.json(updated);
}

// Deleting a user hands their records to the admin doing the delete.
export async function DELETE(_req, { params }) {
  const { user: me, error } = await requireUser({ admin: true });
  if (error) return error;
  const u = await target(params);
  if (!u) return fail("Not found", 404);
  if (u.id === me.id) return fail("You cannot delete yourself");
  await sql`UPDATE contacts SET owner_id = ${me.id} WHERE owner_id = ${u.id}`;
  await sql`UPDATE deals SET owner_id = ${me.id} WHERE owner_id = ${u.id}`;
  await sql`UPDATE tasks SET owner_id = ${me.id} WHERE owner_id = ${u.id}`;
  await sql`DELETE FROM users WHERE id = ${u.id}`;
  return NextResponse.json({ ok: true });
}
