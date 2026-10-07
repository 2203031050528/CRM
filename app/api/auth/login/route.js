import bcrypt from "bcryptjs";
import { sql, initDb } from "@/lib/db";
import { fail, loginResponse, normalizeEmail } from "@/lib/session";

export async function POST(req) {
  await initDb();
  const { email, password } = await req.json();
  const [user] = await sql`SELECT * FROM users WHERE email = ${normalizeEmail(email)}`;
  if (!user || !(await bcrypt.compare(password || "", user.password))) {
    return fail("Invalid email or password", 401);
  }
  if (!user.active) return fail("Your account has been disabled. Contact an admin.", 403);
  return loginResponse(user);
}
