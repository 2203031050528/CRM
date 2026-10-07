"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, fmtDate, downloadCsv } from "@/lib/client";
import { CONTACT_STATUSES } from "@/lib/constants";
import { useUser } from "@/app/components/UserContext";
import { useOptions } from "@/app/components/useOptions";
import { contactFields } from "@/app/components/forms";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";

export default function ContactsPage() {
  const user = useUser();
  const router = useRouter();
  const isAdmin = user.role === "admin";
  const { users } = useOptions({ contacts: false });
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [owner, setOwner] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (owner) p.set("owner_id", owner);
    api(`/api/contacts?${p}`).then(setRows).catch(() => setRows([]));
  }, [q, status, owner]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function create(values) {
    const c = await api("/api/contacts", { method: "POST", body: values });
    setAdding(false);
    router.push(`/contacts/${c.id}`);
  }

  function exportCsv() {
    downloadCsv("contacts.csv", rows, [
      { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" },
      { key: "company", label: "Company" }, { key: "job_title", label: "Job title" }, { key: "status", label: "Status" },
      { key: "source", label: "Source" }, { key: "owner_name", label: "Owner" }, { key: "created_at", label: "Created" },
    ]);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Contacts</h1>
          <p>{isAdmin ? "All contacts across the team." : "People and companies you work with."}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn ghost" onClick={exportCsv} disabled={!rows?.length}>Export CSV</button>
          <button className="btn" onClick={() => setAdding(true)}>+ New contact</button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <input placeholder="Search name, email, phone, company..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {CONTACT_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
          {isAdmin && (
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">All owners</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Status</th>{isAdmin && <th>Owner</th>}<th>Added</th></tr>
            </thead>
            <tbody>
              {rows?.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => router.push(`/contacts/${c.id}`)}>
                  <td><strong>{c.name}</strong>{c.job_title && <div className="muted">{c.job_title}</div>}</td>
                  <td>{c.company || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.phone || "—"}</td>
                  <td><span className={`badge b-${c.status}`}>{c.status}</span></td>
                  {isAdmin && <td>{c.owner_name}</td>}
                  <td className="muted">{fmtDate(c.created_at)}</td>
                </tr>
              ))}
              {rows === null && <tr><td colSpan={7} className="empty">Loading...</td></tr>}
              {rows?.length === 0 && <tr><td colSpan={7} className="empty">No contacts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {adding && (
        <Modal title="New contact" onClose={() => setAdding(false)}>
          <EntityForm fields={contactFields(users)} initial={{ owner_id: String(user.id) }} onSubmit={create}
            onCancel={() => setAdding(false)} submitLabel="Create contact" />
        </Modal>
      )}
    </>
  );
}
