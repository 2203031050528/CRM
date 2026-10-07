import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, initDb } from "@/lib/db";
import { createToken, COOKIE } from "@/lib/auth";

export async function POST(req) {
  await initDb();
  const { email, password } = await req.json();
  const [user] = await sql`SELECT * FROM users WHERE email = ${email?.trim().toLowerCase()}`;
  if (!user || !(await bcrypt.compare(password || "", user.password))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(COOKIE, await createToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
