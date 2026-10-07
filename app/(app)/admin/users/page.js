"use client";
import { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/client";
import { ROLES } from "@/lib/constants";
import { useUser } from "@/app/components/UserContext";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";
import Icon from "@/app/components/Icon";
import Avatar from "@/app/components/Avatar";
import { RoleBadge } from "@/app/components/Badges";

const newUserFields = [
  { name: "name", label: "Full name", required: true },
  { name: "email", label: "Work email", type: "email", required: true },
  { name: "password", label: "Password", type: "password", required: true, minLength: 6, hint: "At least 6 characters." },
  { name: "role", label: "Role", type: "select", options: [{ value: "user", label: "User — sees only their own records" }, { value: "admin", label: "Admin — sees everything and manages users" }], default: "user" },
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
    if (!confirm(`Delete ${u.name}? Their contacts, deals and tasks will be moved to you.`)) return;
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
  const disabled = (users || []).filter((u) => !u.active).length;

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>{users ? `${users.length} users · ${admins} admins · ${disabled} disabled. People who sign up start as users.` : "Manage who can access the CRM."}</p>
        </div>
        <button className="btn" onClick={() => setModal("new")}><Icon name="user" />Add user</button>
      </div>

      <div className="banner info">
        <Icon name="shield" />
        <div><b>Disabling a user signs them out straight away.</b>Their contacts, deals and tasks stay assigned to them. Deleting a user moves their records to you.</div>
      </div>
      {error && <div className="banner error" role="alert">{error}</div>}

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <input className="sm" aria-label="Search users" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Role</th><th>Access</th><th className="r">Contacts</th><th className="r">Deals</th><th className="r">Open tasks</th><th>Joined</th><th className="r">Actions</th></tr>
            </thead>
            <tbody>
              {shown.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-person">
                        <Avatar name={u.name} size={32} />
                        <div><b>{u.name}{self && <span className="small muted"> (you)</span>}</b><span className="small muted">{u.email}</span></div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <RoleBadge role={u.role} />
                        {!self && (
                          <select className="sm" aria-label={`Role for ${u.name}`} value={u.role} onChange={(e) => patch(u, { role: e.target.value })} style={{ width: 90 }}>
                            {ROLES.map((r) => <option key={r} value={r}>{r === "admin" ? "Admin" : "User"}</option>)}
                          </select>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className="toggle" role="switch" aria-checked={u.active} aria-label={`Access for ${u.name}`}
                        disabled={self} onClick={() => patch(u, { active: !u.active })}>
                        <span className="track" />{u.active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="r num">{u.contacts}</td>
                    <td className="r num">{u.deals}</td>
                    <td className="r num">{u.open_tasks}</td>
                    <td className="num muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(u.created_at)}</td>
                    <td className="r" style={{ whiteSpace: "nowrap" }}>
                      <button className="btn ghost sm" onClick={() => setModal({ reset: u })}><Icon name="lock" />Reset password</button>
                      {!self && <button className="btn ghost sm icon" onClick={() => remove(u)} aria-label={`Delete ${u.name}`} style={{ color: "var(--danger)" }}><Icon name="trash" /></button>}
                    </td>
                  </tr>
                );
              })}
              {users === null && <tr><td colSpan={8} className="muted" style={{ textAlign: "center" }}>Loading...</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "new" && (
        <Modal title="Add user" description="They can sign in straight away with this email and password." onClose={() => setModal(null)}>
          <EntityForm fields={newUserFields} submitLabel="Create user" onCancel={() => setModal(null)}
            onSubmit={async (v) => { await api("/api/users", { method: "POST", body: v }); setModal(null); load(); }} />
        </Modal>
      )}
      {modal?.reset && (
        <Modal title={`Reset password for ${modal.reset.name}`} description="Tell them the new password so they can sign in." onClose={() => setModal(null)}>
          <EntityForm fields={[{ name: "password", label: "New password", type: "password", required: true, minLength: 6, hint: "At least 6 characters." }]}
            submitLabel="Set password" onCancel={() => setModal(null)}
            onSubmit={async (v) => { await api(`/api/users/${modal.reset.id}`, { method: "PATCH", body: v }); setModal(null); }} />
        </Modal>
      )}
    </div>
  );
}
