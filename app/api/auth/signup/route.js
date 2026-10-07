import bcrypt from "bcryptjs";
import { sql, initDb } from "@/lib/db";
import { fail, loginResponse, normalizeEmail, validEmail } from "@/lib/session";

// Public sign-up always creates a regular user; only admins can create admins.
export async function POST(req) {
  await initDb();
  const { name, email, password } = await req.json();
  const cleanEmail = normalizeEmail(email);
  if (!name?.trim()) return fail("Name is required");
  if (!validEmail(cleanEmail)) return fail("Enter a valid email");
  if (!password || password.length < 6) return fail("Password must be at least 6 characters");
  const [exists] = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`;
  if (exists) return fail("An account with this email already exists", 409);
  const hash = await bcrypt.hash(password, 10);
  const [user] = await sql`INSERT INTO users (name, email, password, role)
    VALUES (${name.trim()}, ${cleanEmail}, ${hash}, 'user') RETURNING id, name, role`;
  return loginResponse(user, 201);
}
