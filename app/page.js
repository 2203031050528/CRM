"use client";
import { useEffect, useState } from "react";
import Nav from "./Nav";

const empty = { name: "", email: "", phone: "", company: "", status: "lead" };
const STATUSES = ["lead", "contacted", "customer", "lost"];

export default function ContactsPage() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/contacts");
    if (res.ok) setContacts(await res.json());
  }

  useEffect(() => {
    fetch("/api/me").then((r) => r.ok && r.json()).then(setUser);
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    const res = await fetch(editId ? `/api/contacts/${editId}` : "/api/contacts", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) return setError((await res.json()).error);
    setForm(empty);
    setEditId(null);
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    load();
  }

  function edit(c) {
    setEditId(c.id);
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "", company: c.company || "", status: c.status });
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const q = search.toLowerCase();
  const shown = contacts.filter((c) =>
    [c.name, c.email, c.company, c.phone].some((v) => v?.toLowerCase().includes(q)));
  const isAdmin = user?.role === "admin";

  return (
    <>
      <Nav user={user} />
      <div className="container">
        <div className="stats">
          <div className="stat"><b>{contacts.length}</b>Total contacts</div>
          {STATUSES.map((s) => (
            <div className="stat" key={s}><b>{contacts.filter((c) => c.status === s).length}</b>{s}</div>
          ))}
        </div>

        <div className="card">
          <h3>{editId ? "Edit contact" : "Add contact"}</h3>
          <form className="form" onSubmit={save}>
            <input placeholder="Name *" value={form.name} onChange={set("name")} required />
            <input placeholder="Email" type="email" value={form.email} onChange={set("email")} />
            <input placeholder="Phone" value={form.phone} onChange={set("phone")} />
            <input placeholder="Company" value={form.company} onChange={set("company")} />
            <select value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button>{editId ? "Update" : "Add"}</button>
            {editId && <button type="button" className="secondary" onClick={() => { setEditId(null); setForm(empty); }}>Cancel</button>}
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h3>{isAdmin ? "All contacts" : "My contacts"}</h3>
            <input style={{ maxWidth: 240 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Status</th>{isAdmin && <th>Owner</th>}<th></th></tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td><td>{c.company}</td>
                    <td><span className="badge">{c.status}</span></td>
                    {isAdmin && <td>{c.owner_name}</td>}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="small" onClick={() => edit(c)}>Edit</button>
                      <button className="small danger" onClick={() => remove(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={7}>No contacts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
