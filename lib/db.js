import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const sql = neon(process.env.DATABASE_URL);

let ready;

// Creates/migrates tables and the first admin on first use (once per server instance).
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
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true`;
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
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS job_title TEXT`;
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT`;
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT`;
    await sql`CREATE TABLE IF NOT EXISTS deals (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      value NUMERIC(14,2) NOT NULL DEFAULT 0,
      stage TEXT NOT NULL DEFAULT 'new',
      expected_close DATE,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATE,
      priority TEXT NOT NULL DEFAULT 'medium',
      done BOOLEAN NOT NULL DEFAULT false,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      body TEXT NOT NULL,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    // Map statuses from the earlier version onto the shared pipeline.
    await sql`UPDATE contacts SET status = CASE status
      WHEN 'lead' THEN 'new' WHEN 'prospect' THEN 'qualified'
      WHEN 'customer' THEN 'won' WHEN 'inactive' THEN 'lost' END
      WHERE status IN ('lead','prospect','customer','inactive')`;
    await sql`ALTER TABLE contacts ALTER COLUMN status SET DEFAULT 'new'`;
    await sql`UPDATE deals SET stage = 'proposal' WHERE stage = 'negotiation'`;
    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM users`;
    if (count === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
      await sql`INSERT INTO users (name, email, password, role)
        VALUES ('Admin', ${(process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase()}, ${hash}, 'admin')`;
    }
  })().catch((e) => { ready = undefined; throw e; });
  return ready;
}
