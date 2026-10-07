import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession, unauthorized, forbidden } from "@/lib/auth";

export async function DELETE(_req, { params }) {
  const me = await getSession();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const id = Number((await params).id);
  if (id === me.id) {
    return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 });
  }
  await initDb();
  await sql`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
