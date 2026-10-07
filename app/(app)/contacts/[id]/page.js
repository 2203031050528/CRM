"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, money, fmtDate, shortDate, dueLabel } from "@/lib/client";
import { useUser } from "@/app/components/UserContext";
import { useOptions } from "@/app/components/useOptions";
import { contactFields, dealFields, taskFields, toForm } from "@/app/components/forms";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";
import Card, { Empty } from "@/app/components/Card";
import Icon from "@/app/components/Icon";
import Avatar from "@/app/components/Avatar";
import { StatusBadge } from "@/app/components/Badges";

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
  const [toast, setToast] = useState("");

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
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  if (error) {
    return (
      <div className="content">
        <div className="card"><Empty icon="users" title="Contact not found" action={<Link href="/contacts" className="btn secondary sm">Back to contacts</Link>}>{error}</Empty></div>
      </div>
    );
  }
  if (!contact) return <div className="content"><p className="muted">Loading...</p></div>;

  const close = () => setModal(null);
  const save = (url, method, message) => async (values) => {
    await api(url, { method, body: { ...values, ...(values.value !== undefined && { value: values.value || 0 }) } });
    close();
    setToast(message);
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
    setToast("Note added");
  }

  async function deleteNote(nid) {
    await api(`/api/notes/${nid}`, { method: "DELETE" });
    setNotes(notes.filter((n) => n.id !== nid));
  }

  async function toggleTask(t) {
    setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
    await api(`/api/tasks/${t.id}`, { method: "PUT", body: { done: !t.done } });
  }

  const details = [
    { icon: "mail", label: "Email", value: contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a> },
    { icon: "phone", label: "Phone", value: contact.phone && <a href={`tel:${contact.phone}`} className="num">{contact.phone}</a> },
    { icon: "building", label: "Company", value: contact.company },
    { icon: "briefcase", label: "Job title", value: contact.job_title },
    { icon: "tag", label: "Source", value: contact.source && contact.source[0].toUpperCase() + contact.source.slice(1) },
    { icon: "inbox", label: "Address", value: contact.address },
    { icon: "user", label: "Owner", value: contact.owner_name },
  ];
  const openTasks = tasks.filter((t) => !t.done).length;
  const dealTotal = deals.reduce((n, d) => n + d.value, 0);
  const linked = { contact_id: String(contact.id), owner_id: String(contact.owner_id) };

  return (
    <div className="content">
      {user.role === "admin" && contact.owner_id !== user.id && (
        <div className="banner info"><Icon name="shield" />This contact belongs to {contact.owner_name}. Changes you make are saved to their record.</div>
      )}
      <div className="page-head" style={{ alignItems: "center" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar name={contact.name} size={56} />
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <h1>{contact.name}</h1><StatusBadge status={contact.status} />
            </div>
            <p>{[contact.job_title, contact.company].filter(Boolean).join(" at ") || "No company"} · Added {fmtDate(contact.created_at)}</p>
          </div>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={() => setModal("edit")}><Icon name="edit" />Edit contact</button>
          <button className="btn danger" onClick={remove}><Icon name="trash" />Delete</button>
        </div>
      </div>

      <div className="row">
        <div className="side-col">
          <Card title="Contact">
            <dl className="details">
              {details.map((d) => (
                <div key={d.label}>
                  <Icon name={d.icon} />
                  <div><dt>{d.label}</dt><dd>{d.value || <span className="muted">—</span>}</dd></div>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Tasks" subtitle={`${openTasks} open · ${tasks.length - openTasks} done`} raw
            footer={<button className="btn ghost sm" onClick={() => setModal("task")}><Icon name="plus" />Add task</button>}>
            {tasks.length === 0 ? <Empty icon="check-circle" title="No tasks yet">Add a follow-up so it isn't forgotten.</Empty> : (
              <div>
                {tasks.map((t) => {
                  const due = t.done ? { text: "Done", tone: "muted" } : dueLabel(t.due_date);
                  return (
                    <div className={`task ${t.done ? "done" : ""}`} key={t.id} style={{ padding: "12px 24px" }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} aria-label={`Mark "${t.title}" done`} />
                      <div className="grow">
                        <span className="title">{t.title}</span>
                        <span className={`small num t-${due.tone}`}>{due.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="wide-col">
          <Card title="Deals" subtitle={`${deals.length} ${deals.length === 1 ? "deal" : "deals"} · ${money(dealTotal)} total`} raw
            footer={<button className="btn ghost sm" onClick={() => setModal("deal")}><Icon name="plus" />Add deal</button>}>
            {deals.length === 0 ? <Empty icon="pipeline" title="No deals yet">Track what this contact might buy.</Empty> : (
              <ul className="list">
                {deals.map((d) => (
                  <li key={d.id}>
                    <div className="grow"><b>{d.title}</b><span className="small muted">Expected close {shortDate(d.expected_close)}</span></div>
                    <span className="strong num" style={{ color: "var(--text)" }}>{money(d.value)}</span>
                    <StatusBadge status={d.stage} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Notes and activity" subtitle="Log calls, meetings and anything worth remembering.">
            <form className="composer" onSubmit={addNote}>
              <label className="field">
                <span>Add a note</span>
                <textarea placeholder="Called Jane — wants pricing for 40 seats." value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn sm" disabled={!note.trim()}><Icon name="note" />Add note</button>
              </div>
            </form>
            {notes.length === 0 ? <p className="small muted" style={{ marginTop: 16 }}>No notes yet.</p> : (
              <ol className="timeline">
                {notes.map((n) => (
                  <li key={n.id}>
                    <span className="ic"><Icon name="note" size={14} /></span>
                    <div className="body">
                      <p>{n.body}</p>
                      <div className="meta">
                        <span>{n.author_name || "Deleted user"} · {new Date(n.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        {(user.role === "admin" || n.author_id === user.id) && (
                          <button className="link-btn danger small" onClick={() => deleteNote(n.id)}>Delete</button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      {modal === "edit" && (
        <Modal title="Edit contact" onClose={close}>
          <EntityForm fields={contactFields(users)} initial={toForm(contact)} onSubmit={save(`/api/contacts/${id}`, "PUT", "Changes saved")} onCancel={close} />
        </Modal>
      )}
      {modal === "deal" && (
        <Modal title="Add deal" description={`Linked to ${contact.name}.`} onClose={close}>
          <EntityForm fields={dealFields([contact], users)} initial={linked} onSubmit={save("/api/deals", "POST", "Deal added")} onCancel={close} submitLabel="Create deal" />
        </Modal>
      )}
      {modal === "task" && (
        <Modal title="Add task" description={`Linked to ${contact.name}.`} onClose={close}>
          <EntityForm fields={taskFields([contact], users)} initial={linked} onSubmit={save("/api/tasks", "POST", "Task added")} onCancel={close} submitLabel="Create task" />
        </Modal>
      )}
      {toast && <div className="toast" role="status"><Icon name="check" />{toast}</div>}
    </div>
  );
}
