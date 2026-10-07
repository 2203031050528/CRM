import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}

// Used by links and by the app layout when a session is no longer valid.
export async function GET(req) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(COOKIE);
  return res;
}
