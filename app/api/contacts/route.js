import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/auth";

// Admins see every contact; users see only their own.
export async function GET() {
  const me = await getSession();
  if (!me) return unauthorized();
  await initDb();
  const contacts = me.role === "admin"
    ? await sql`SELECT c.*, u.name AS owner_name FROM contacts c
        LEFT JOIN users u ON u.id = c.owner_id ORDER BY c.id DESC`
    : await sql`SELECT c.*, u.name AS owner_name FROM contacts c
        LEFT JOIN users u ON u.id = c.owner_id WHERE c.owner_id = ${me.id} ORDER BY c.id DESC`;
  return NextResponse.json(contacts);
}

export async function POST(req) {
  const me = await getSession();
  if (!me) return unauthorized();
  await initDb();
  const { name, email, phone, company, status } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const [contact] = await sql`INSERT INTO contacts (name, email, phone, company, status, owner_id)
    VALUES (${name}, ${email || null}, ${phone || null}, ${company || null}, ${status || "lead"}, ${me.id})
    RETURNING *`;
  return NextResponse.json(contact, { status: 201 });
}
