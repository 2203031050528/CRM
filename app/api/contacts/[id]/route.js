import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/auth";

async function findAllowed(id, me) {
  const [c] = await sql`SELECT * FROM contacts WHERE id = ${id}`;
  return c && (me.role === "admin" || c.owner_id === me.id) ? c : null;
}

export async function PUT(req, { params }) {
  const me = await getSession();
  if (!me) return unauthorized();
  await initDb();
  const id = Number((await params).id);
  if (!(await findAllowed(id, me))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { name, email, phone, company, status } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const [contact] = await sql`UPDATE contacts SET name = ${name}, email = ${email || null},
    phone = ${phone || null}, company = ${company || null}, status = ${status || "lead"}
    WHERE id = ${id} RETURNING *`;
  return NextResponse.json(contact);
}

export async function DELETE(_req, { params }) {
  const me = await getSession();
  if (!me) return unauthorized();
  await initDb();
  const id = Number((await params).id);
  if (!(await findAllowed(id, me))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await sql`DELETE FROM contacts WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
