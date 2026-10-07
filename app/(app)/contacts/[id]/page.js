"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, money, fmtDate, isOverdue } from "@/lib/client";
import { useUser } from "@/app/components/UserContext";
import { useOptions } from "@/app/components/useOptions";
import { contactFields, dealFields, taskFields, toForm } from "@/app/components/forms";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";

export default function ContactDetail({ params }) {
  const { id } = use(params);
  const user = useUser();
  const router = useRouter();
  const { users } = useOptions({ contacts: false });
  const [contact, setContact] = useState(null);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState("");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, d, t, n] = await Promise.all([
        api(`/api/contacts/${id}`), api(`/api/deals?contact_id=${id}`),
        api(`/api/tasks?contact_id=${id}`), api(`/api/contacts/${id}/notes`),
      ]);
      setContact(c); setDeals(d); setTasks(t); setNotes(n);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="card"><div className="error">{error}</div><p><Link href="/contacts">← Back to contacts</Link></p></div>;
  if (!contact) return <div className="muted">Loading...</div>;

  const close = () => setModal(null);
  const save = (url, method) => async (values) => {
    await api(url, { method, body: { ...values, ...(values.value !== undefined && { value: values.value || 0 }) } });
    close();
    load();
  };

  async function remove() {
    if (!confirm(`Delete ${contact.name}? Notes are deleted too; deals and tasks are kept but unlinked.`)) return;
    await api(`/api/contacts/${id}`, { method: "DELETE" });
    router.push("/contacts");
  }

  async function addNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    const n = await api(`/api/contacts/${id}/notes`, { method: "POST", body: { body: note } });
    setNotes([n, ...notes]);
    setNote("");
  }

  async function deleteNote(nid) {
    await api(`/api/notes/${nid}`, { method: "DELETE" });
    setNotes(notes.filter((n) => n.id !== nid));
  }

  async function toggleTask(t) {
    await api(`/api/tasks/${t.id}`, { method: "PUT", body: { done: !t.done } });
    load();
  }

  const contactOpt = [contact];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="muted" style={{ marginBottom: 6 }}><Link href="/contacts">← Contacts</Link></div>
          <h1>{contact.name} <span className={`badge b-${contact.status}`}>{contact.status}</span></h1>
          <p>{[contact.job_title, contact.company].filter(Boolean).join(" at ") || "No company"}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn ghost" onClick={() => setModal("edit")}>Edit</button>
          <button className="btn danger" onClick={remove}>Delete</button>
        </div>
      </div>

      <div className="grid two">
        <div>
          <div className="card">
            <h2>Details</h2>
            <dl className="detail-list">
              <dt>Email</dt><dd>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : "—"}</dd>
              <dt>Phone</dt><dd>{contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : "—"}</dd>
              <dt>Company</dt><dd>{contact.company || "—"}</dd>
              <dt>Job title</dt><dd>{contact.job_title || "—"}</dd>
              <dt>Source</dt><dd style={{ textTransform: "capitalize" }}>{contact.source || "—"}</dd>
              <dt>Address</dt><dd style={{ whiteSpace: "pre-wrap" }}>{contact.address || "—"}</dd>
              <dt>Owner</dt><dd>{contact.owner_name}</dd>
              <dt>Added</dt><dd>{fmtDate(contact.created_at)}</dd>
            </dl>
          </div>

          <div className="card">
            <div className="page-head" style={{ marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Deals ({deals.length})</h2>
              <button className="btn sm" onClick={() => setModal("deal")}>+ Add deal</button>
            </div>
            {deals.length === 0 && <div className="empty">No deals yet.</div>}
            {deals.map((d) => (
              <div className="list-item" key={d.id}>
                <span><strong>{d.title}</strong><div className="muted">Close: {fmtDate(d.expected_close)}</div></span>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <strong>{money(d.value)}</strong>
                  <span className={`badge b-${d.stage}`}>{d.stage}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="page-head" style={{ marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Tasks ({tasks.filter((t) => !t.done).length} open)</h2>
              <button className="btn sm" onClick={() => setModal("task")}>+ Add task</button>
            </div>
            {tasks.length === 0 && <div className="empty">No tasks yet.</div>}
            {tasks.map((t) => (
              <div className={`task-row ${t.done ? "done" : ""}`} key={t.id}>
                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} />
                <div className="body">
                  <div className="title">{t.title}</div>
                  <div className="meta">
                    <span className={isOverdue(t) ? "badge b-overdue" : ""}>Due {fmtDate(t.due_date)}</span>
                    <span className={`badge b-${t.priority}`}>{t.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Notes & activity</h2>
          <form onSubmit={addNote} style={{ marginBottom: 18 }}>
            <textarea placeholder="Log a call, meeting or note..." value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="form-actions" style={{ marginTop: 8 }}><button className="btn sm" disabled={!note.trim()}>Add note</button></div>
          </form>
          {notes.length === 0 && <div className="empty">No notes yet.</div>}
          {notes.map((n) => (
            <div className="note" key={n.id}>
              <p>{n.body}</p>
              <div className="meta">
                <span>{n.author_name || "Deleted user"} · {new Date(n.created_at).toLocaleString()}</span>
                {(user.role === "admin" || n.author_id === user.id) && (
                  <button className="link-btn danger" onClick={() => deleteNote(n.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal === "edit" && (
        <Modal title="Edit contact" onClose={close}>
          <EntityForm fields={contactFields(users)} initial={toForm(contact)} onSubmit={save(`/api/contacts/${id}`, "PUT")} onCancel={close} />
        </Modal>
      )}
      {modal === "deal" && (
        <Modal title="New deal" onClose={close}>
          <EntityForm fields={dealFields(contactOpt, users)} initial={{ contact_id: String(contact.id), owner_id: String(contact.owner_id) }}
            onSubmit={save("/api/deals", "POST")} onCancel={close} submitLabel="Create deal" />
        </Modal>
      )}
      {modal === "task" && (
        <Modal title="New task" onClose={close}>
          <EntityForm fields={taskFields(contactOpt, users)} initial={{ contact_id: String(contact.id), owner_id: String(contact.owner_id) }}
            onSubmit={save("/api/tasks", "POST")} onCancel={close} submitLabel="Create task" />
        </Modal>
      )}
    </>
  );
}
