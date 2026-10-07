import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { user: me, error } = await requireUser();
  if (error) return error;
  const admin = me.role === "admin";
  const own = admin ? "TRUE" : "t.owner_id = $1";
  const p = admin ? [] : [me.id];
  const q = (text) => sql.query(text, p);

  const [contacts, deals, [tasks], recent, upcoming, team] = await Promise.all([
    q(`SELECT status, COUNT(*)::int AS count FROM contacts t WHERE ${own} GROUP BY status`),
    q(`SELECT stage, COUNT(*)::int AS count, COALESCE(SUM(value),0)::float8 AS value FROM deals t WHERE ${own} GROUP BY stage`),
    q(`SELECT COUNT(*) FILTER (WHERE NOT done)::int AS open,
         COUNT(*) FILTER (WHERE NOT done AND due_date < CURRENT_DATE)::int AS overdue,
         COUNT(*) FILTER (WHERE NOT done AND due_date = CURRENT_DATE)::int AS today,
         COUNT(*) FILTER (WHERE done)::int AS done
       FROM tasks t WHERE ${own}`),
    q(`SELECT t.id, t.name, t.company, t.status, t.created_at FROM contacts t WHERE ${own} ORDER BY t.id DESC LIMIT 5`),
    q(`SELECT t.id, t.title, t.due_date::text AS due_date, t.priority FROM tasks t
       WHERE ${own} AND NOT t.done ORDER BY t.due_date NULLS LAST, t.id LIMIT 6`),
    admin
      ? sql`SELECT u.id, u.name,
          (SELECT COUNT(*)::int FROM contacts WHERE owner_id = u.id) AS contacts,
          (SELECT COUNT(*)::int FROM deals WHERE owner_id = u.id AND stage NOT IN ('won','lost')) AS open_deals,
          (SELECT COALESCE(SUM(value),0)::float8 FROM deals WHERE owner_id = u.id AND stage = 'won') AS won_value
        FROM users u WHERE u.active ORDER BY won_value DESC, u.name`
      : [],
  ]);

  return NextResponse.json({ contacts, deals, tasks, recent, upcoming, team });
}
