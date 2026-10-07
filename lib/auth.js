import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Edge-safe helpers (used by middleware). DB-backed checks live in lib/session.js.
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
export const COOKIE = "crm_token";

export async function createToken(user) {
  return new SignJWT({ id: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verifyToken(token) : null;
}
