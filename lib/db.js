import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const sql = neon(process.env.DATABASE_URL);

let ready;

// Creates tables and the first admin on first use (once per server instance).
export function initDb() {
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','user')),
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      status TEXT NOT NULL DEFAULT 'lead',
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM users`;
    if (count === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
      await sql`INSERT INTO users (name, email, password, role)
        VALUES ('Admin', ${(process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase()}, ${hash}, 'admin')`;
    }
  })().catch((e) => { ready = undefined; throw e; });
  return ready;
}
