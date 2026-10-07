import { NextResponse } from "next/server";
import { verifyToken, COOKIE } from "@/lib/auth";

export async function middleware(req) {
  const token = req.cookies.get(COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    return user ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/admin/:path*"] };
