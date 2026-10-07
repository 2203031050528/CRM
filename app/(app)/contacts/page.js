"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, shortDate, downloadCsv } from "@/lib/client";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";
import { useUser } from "@/app/components/UserContext";
import { useOptions } from "@/app/components/useOptions";
import { contactFields } from "@/app/components/forms";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";
import Icon from "@/app/components/Icon";
import Avatar from "@/app/components/Avatar";
import { Empty } from "@/app/components/Card";
import { StatusBadge } from "@/app/components/Badges";

const PAGE_SIZE = 10;

export default function ContactsPage() {
  const user = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const isAdmin = user.role === "admin";
  const { users } = useOptions({ contacts: false });
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [owner, setOwner] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(params.get("new") === "1");

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (owner) p.set("owner_id", owner);
    api(`/api/contacts?${p}`).then((r) => { setRows(r); setPage(1); }).catch(() => setRows([]));
  }, [q, status, owner]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function create(values) {
    const c = await api("/api/contacts", { method: "POST", body: values });
    router.push(`/contacts/${c.id}`);
  }

  function exportCsv() {
    downloadCsv("contacts.csv", rows, [
      { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" },
      { key: "company", label: "Company" }, { key: "job_title", label: "Job title" }, { key: "status", label: "Status" },
      { key: "source", label: "Source" }, { key: "owner_name", label: "Owner" }, { key: "created_at", label: "Created" },
    ]);
  }

  const filtered = q || status || owner;
  const total = rows?.length || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const shown = (rows || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const cols = isAdmin ? 7 : 6;

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>{isAdmin ? "All contacts" : "My contacts"}</h1>
          <p>{rows ? `${total} ${total === 1 ? "contact" : "contacts"}${filtered ? " match your filters" : ""}. Select a row to open it.` : "People and companies you work with."}</p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={exportCsv} disabled={!total}><Icon name="download" />Export CSV</button>
          <button className="btn" onClick={() => setAdding(true)}><Icon name="plus" />Add contact</button>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <input className="sm" aria-label="Search contacts" placeholder="Search name, email, phone or company" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select className="sm" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          {isAdmin && (
            <select className="sm" aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">All owners</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Company</th><th>Phone</th><th>Status</th><th>Source</th>{isAdmin && <th>Owner</th>}<th>Added</th></tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => router.push(`/contacts/${c.id}`)}>
                  <td>
                    <div className="cell-person">
                      <Avatar name={c.name} size={32} />
                      <div><b>{c.name}</b><span className="small muted">{c.email || "No email"}</span></div>
                    </div>
                  </td>
                  <td>{c.company || "—"}{c.job_title && <div className="small muted">{c.job_title}</div>}</td>
                  <td className="num" style={{ whiteSpace: "nowrap" }}>{c.phone || "—"}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ textTransform: "capitalize" }}>{c.source || "—"}</td>
                  {isAdmin && <td style={{ whiteSpace: "nowrap" }}>{c.owner_name}</td>}
                  <td className="num muted" style={{ whiteSpace: "nowrap" }}>{shortDate(c.created_at)}</td>
                </tr>
              ))}
              {rows === null && <tr><td colSpan={cols} className="muted" style={{ textAlign: "center" }}>Loading...</td></tr>}
              {rows?.length === 0 && (
                <tr><td colSpan={cols} className="empty-cell">
                  {filtered
                    ? <Empty icon="search" title="No contacts match" action={<button className="btn secondary sm" onClick={() => { setQ(""); setStatus(""); setOwner(""); }}>Clear filters</button>}>Try a different search or filter.</Empty>
                    : <Empty icon="users" title="No contacts yet" action={<button className="btn sm" onClick={() => setAdding(true)}><Icon name="plus" />Add contact</button>}>Add the people and companies you work with.</Empty>}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {total > PAGE_SIZE && (
          <div className="pagination">
            <span className="num">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} contacts</span>
            <div className="actions">
              <button className="btn secondary sm icon" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><Icon name="chevron-left" /></button>
              <button className="btn secondary sm icon" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page"><Icon name="chevron-right" /></button>
            </div>
          </div>
        )}
      </div>

      {adding && (
        <Modal title="Add contact" description="Fields marked * are required. You'll be set as the owner." onClose={() => setAdding(false)}>
          <EntityForm fields={contactFields(users)} initial={{ owner_id: String(user.id) }} onSubmit={create}
            onCancel={() => setAdding(false)} submitLabel="Create contact" />
        </Modal>
      )}
    </div>
  );
}
