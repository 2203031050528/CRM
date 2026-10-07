import { NextResponse } from "next/server";
import { verifyToken, COOKIE } from "@/lib/auth";

const PUBLIC = ["/login", "/signup"];

export async function middleware(req) {
  const token = req.cookies.get(COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  const isPublic = PUBLIC.includes(req.nextUrl.pathname);

  if (isPublic && user) return NextResponse.redirect(new URL("/", req.url));
  if (!isPublic && !user) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
