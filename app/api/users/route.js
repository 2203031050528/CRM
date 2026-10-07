import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, initDb } from "@/lib/db";
import { getSession, unauthorized, forbidden } from "@/lib/auth";

export async function GET() {
  const me = await getSession();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  await initDb();
  const users = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY id`;
  return NextResponse.json(users);
}

export async function POST(req) {
  const me = await getSession();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  await initDb();
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password || !["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Name, email, password and role are required" }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [user] = await sql`INSERT INTO users (name, email, password, role)
      VALUES (${name}, ${email.trim().toLowerCase()}, ${hash}, ${role})
      RETURNING id, name, email, role, created_at`;
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
}
