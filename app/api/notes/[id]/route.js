import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUser, fail } from "@/lib/session";

export async function DELETE(_req, { params }) {
  const { user: me, error } = await requireUser();
  if (error) return error;
  const id = Number((await params).id);
  const [note] = await sql`SELECT id, author_id FROM notes WHERE id = ${id}`;
  if (!note || (me.role !== "admin" && note.author_id !== me.id)) return fail("Not found", 404);
  await sql`DELETE FROM notes WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
