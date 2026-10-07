"use client";
import { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/client";
import { ROLES } from "@/lib/constants";
import { useUser } from "@/app/components/UserContext";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";

const newUserFields = [
  { name: "name", label: "Full name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "password", label: "Password", type: "password", required: true, minLength: 6 },
  { name: "role", label: "Role", type: "select", options: ROLES, default: "user" },
];

export default function UsersPage() {
  const me = useUser();
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null); // "new" | { reset: user }
  const [error, setError] = useState("");

  const load = () => api("/api/users").then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function patch(u, body) {
    setError("");
    try {
      await api(`/api/users/${u.id}`, { method: "PATCH", body });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(u) {
    if (!confirm(`Delete ${u.name}? Their contacts, deals and tasks will be reassigned to you.`)) return;
    setError("");
    try {
      await api(`/api/users/${u.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const term = q.toLowerCase();
  const shown = (users || []).filter((u) => u.name.toLowerCase().includes(term) || u.email.includes(term));
  const admins = (users || []).filter((u) => u.role === "admin").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>{users ? `${users.length} users · ${admins} admins · ${users.filter((u) => !u.active).length} disabled` : "Manage who can access the CRM."}</p>
        </div>
        <button className="btn" onClick={() => setModal("new")}>+ Add user</button>
      </div>

      <div className="card">
        <div className="toolbar"><input placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Role</th><th>Status</th><th>Contacts</th><th>Deals</th><th>Open tasks</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {shown.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong>{self && <span className="muted"> (you)</span>}<div className="muted">{u.email}</div></td>
                    <td>
                      <select value={u.role} disabled={self} onChange={(e) => patch(u, { role: e.target.value })} style={{ width: "auto" }}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge ${u.active ? "b-active" : "b-disabled"}`}>{u.active ? "Active" : "Disabled"}</span></td>
                    <td>{u.contacts}</td>
                    <td>{u.deals}</td>
                    <td>{u.open_tasks}</td>
                    <td className="muted">{fmtDate(u.created_at)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn ghost sm" onClick={() => setModal({ reset: u })}>Reset password</button>{" "}
                      {!self && (
                        <>
                          <button className="btn ghost sm" onClick={() => patch(u, { active: !u.active })}>{u.active ? "Disable" : "Enable"}</button>{" "}
                          <button className="btn danger sm" onClick={() => remove(u)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users === null && <tr><td colSpan={8} className="empty">Loading...</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "new" && (
        <Modal title="Add user" onClose={() => setModal(null)}>
          <EntityForm fields={newUserFields} submitLabel="Create user" onCancel={() => setModal(null)}
            onSubmit={async (v) => { await api("/api/users", { method: "POST", body: v }); setModal(null); load(); }} />
        </Modal>
      )}
      {modal?.reset && (
        <Modal title={`Reset password for ${modal.reset.name}`} onClose={() => setModal(null)}>
          <EntityForm fields={[{ name: "password", label: "New password", type: "password", required: true, minLength: 6 }]}
            submitLabel="Set password" onCancel={() => setModal(null)}
            onSubmit={async (v) => { await api(`/api/users/${modal.reset.id}`, { method: "PATCH", body: v }); setModal(null); }} />
        </Modal>
      )}
    </>
  );
}
