"use client";
import { useEffect, useState } from "react";
import Nav from "../Nav";

const empty = { name: "", email: "", password: "", role: "user" };

export default function AdminPage() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }

  useEffect(() => {
    fetch("/api/me").then((r) => r.ok && r.json()).then(setMe);
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) return setError((await res.json()).error);
    setForm(empty);
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this user and all their contacts?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error);
    load();
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <Nav user={me} />
      <div className="container">
        <div className="card">
          <h3>Add user</h3>
          <form className="form" onSubmit={create}>
            <input placeholder="Name" value={form.name} onChange={set("name")} required />
            <input placeholder="Email" type="email" value={form.email} onChange={set("email")} required />
            <input placeholder="Password" type="password" value={form.password} onChange={set("password")} required minLength={6} />
            <select value={form.role} onChange={set("role")}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button>Create</button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        <div className="card">
          <h3>Users</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td><td>{u.email}</td>
                    <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>{u.id !== me?.id && <button className="small danger" onClick={() => remove(u.id)}>Delete</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
