import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUser, fail } from "@/lib/session";

async function canAccess(params, me) {
  const id = Number((await params).id);
  const [c] = await sql`SELECT id, owner_id FROM contacts WHERE id = ${id}`;
  return c && (me.role === "admin" || c.owner_id === me.id) ? c : null;
}

export async function GET(_req, { params }) {
  const { user: me, error } = await requireUser();
  if (error) return error;
  const contact = await canAccess(params, me);
  if (!contact) return fail("Not found", 404);
  const notes = await sql`SELECT n.*, u.name AS author_name FROM notes n
    LEFT JOIN users u ON u.id = n.author_id WHERE n.contact_id = ${contact.id} ORDER BY n.id DESC`;
  return NextResponse.json(notes);
}

export async function POST(req, { params }) {
  const { user: me, error } = await requireUser();
  if (error) return error;
  const contact = await canAccess(params, me);
  if (!contact) return fail("Not found", 404);
  const { body } = await req.json();
  if (!body?.trim()) return fail("Note cannot be empty");
  const [note] = await sql`INSERT INTO notes (body, contact_id, author_id)
    VALUES (${body.trim()}, ${contact.id}, ${me.id}) RETURNING *`;
  return NextResponse.json({ ...note, author_name: me.name }, { status: 201 });
}
