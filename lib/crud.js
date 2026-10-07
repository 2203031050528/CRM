import { NextResponse } from "next/server";
import { sql } from "./db";
import { requireUser, fail } from "./session";

// Builds owner-scoped CRUD handlers: admins see everything, users only their own rows.
export function resource({ table, fields, required = [], enums = {}, cast = {}, filters = [], search = [], order = "t.id DESC", withContact = false }) {
  const cols = ["id", "owner_id", "created_at", ...fields]
    .map((f) => (cast[f] ? `t.${f}::${cast[f]} AS ${f}` : `t.${f}`))
    .join(", ");
  const base = `SELECT ${cols}, u.name AS owner_name${withContact ? ", c.name AS contact_name" : ""}
    FROM ${table} t LEFT JOIN users u ON u.id = t.owner_id
    ${withContact ? "LEFT JOIN contacts c ON c.id = t.contact_id" : ""}`;

  const getOne = async (id) => (await sql.query(`${base} WHERE t.id = $1`, [id]))[0];

  async function clean(body, me, isCreate) {
    const data = {};
    for (const f of fields) {
      if (!(f in body)) continue;
      const v = typeof body[f] === "string" ? body[f].trim() : body[f];
      data[f] = v === "" || v === undefined ? null : v;
    }
    if (me.role === "admin" && body.owner_id) data.owner_id = Number(body.owner_id);
    for (const f of required) {
      if ((isCreate || f in data) && data[f] == null) return { error: `${f.replace("_", " ")} is required` };
    }
    for (const [f, values] of Object.entries(enums)) {
      if (data[f] != null && !values.includes(data[f])) return { error: `Invalid ${f}` };
    }
    if (data.contact_id != null) {
      data.contact_id = Number(data.contact_id);
      const [c] = await sql`SELECT owner_id FROM contacts WHERE id = ${data.contact_id}`;
      if (!c || (me.role !== "admin" && c.owner_id !== me.id)) return { error: "Invalid contact" };
    }
    if (data.owner_id != null) {
      const [u] = await sql`SELECT id FROM users WHERE id = ${data.owner_id}`;
      if (!u) return { error: "Invalid owner" };
    }
    return { data };
  }

  async function load(params, me) {
    const id = Number((await params).id);
    const row = Number.isInteger(id) ? await getOne(id) : null;
    return row && (me.role === "admin" || row.owner_id === me.id) ? row : null;
  }

  return {
    async list(req) {
      const { user: me, error } = await requireUser();
      if (error) return error;
      const params = [];
      const where = [];
      const add = (cond, val) => { params.push(val); where.push(cond.replace("?", `$${params.length}`)); };
      if (me.role !== "admin") add("t.owner_id = ?", me.id);
      const sp = req.nextUrl.searchParams;
      for (const f of filters) {
        const v = sp.get(f);
        if (v) add(`t.${f} = ?`, f === "done" ? v === "true" : v);
      }
      const q = sp.get("q")?.trim();
      if (q && search.length) {
        params.push(`%${q}%`);
        where.push(`(${search.map((f) => `t.${f} ILIKE $${params.length}`).join(" OR ")})`);
      }
      const rows = await sql.query(`${base} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order}`, params);
      return NextResponse.json(rows);
    },

    async create(req) {
      const { user: me, error } = await requireUser();
      if (error) return error;
      const { data, error: invalid } = await clean(await req.json(), me, true);
      if (invalid) return fail(invalid);
      data.owner_id ??= me.id;
      const keys = Object.keys(data);
      const [row] = await sql.query(
        `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`,
        keys.map((k) => data[k]),
      );
      return NextResponse.json(await getOne(row.id), { status: 201 });
    },

    async get(_req, { params }) {
      const { user: me, error } = await requireUser();
      if (error) return error;
      const row = await load(params, me);
      return row ? NextResponse.json(row) : fail("Not found", 404);
    },

    async update(req, { params }) {
      const { user: me, error } = await requireUser();
      if (error) return error;
      const row = await load(params, me);
      if (!row) return fail("Not found", 404);
      const { data, error: invalid } = await clean(await req.json(), me, false);
      if (invalid) return fail(invalid);
      const keys = Object.keys(data);
      if (keys.length) {
        await sql.query(
          `UPDATE ${table} SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(", ")} WHERE id = $${keys.length + 1}`,
          [...keys.map((k) => data[k]), row.id],
        );
      }
      return NextResponse.json(await getOne(row.id));
    },

    async remove(_req, { params }) {
      const { user: me, error } = await requireUser();
      if (error) return error;
      const row = await load(params, me);
      if (!row) return fail("Not found", 404);
      await sql.query(`DELETE FROM ${table} WHERE id = $1`, [row.id]);
      return NextResponse.json({ ok: true });
    },
  };
}
