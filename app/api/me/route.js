import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  return user ? NextResponse.json(user) : unauthorized();
}
