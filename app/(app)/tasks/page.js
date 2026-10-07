"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, dueLabel, isOverdue, today } from "@/lib/client";
import { useUser } from "@/app/components/UserContext";
import { useOptions } from "@/app/components/useOptions";
import { taskFields, toForm } from "@/app/components/forms";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";
import Icon from "@/app/components/Icon";
import { Empty } from "@/app/components/Card";
import { PriorityBadge } from "@/app/components/Badges";

const VIEWS = { open: "Open", today: "Due today", overdue: "Overdue", done: "Completed", all: "All" };

export default function TasksPage() {
  const user = useUser();
  const isAdmin = user.role === "admin";
  const { contacts, users } = useOptions();
  const [tasks, setTasks] = useState(null);
  const [view, setView] = useState("open");
  const [owner, setOwner] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(() => {
    api(`/api/tasks${owner ? `?owner_id=${owner}` : ""}`).then(setTasks).catch(() => setTasks([]));
  }, [owner]);
  useEffect(() => { load(); }, [load]);

  const filters = {
    open: (t) => !t.done,
    today: (t) => !t.done && t.due_date === today(),
    overdue: isOverdue,
    done: (t) => t.done,
    all: () => true,
  };
  const shown = (tasks || []).filter(filters[view]);
  const count = (v) => (tasks || []).filter(filters[v]).length;

  async function toggle(t) {
    setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
    await api(`/api/tasks/${t.id}`, { method: "PUT", body: { done: !t.done } });
  }

  async function save(values) {
    if (modal === "new") await api("/api/tasks", { method: "POST", body: values });
    else await api(`/api/tasks/${modal.id}`, { method: "PUT", body: values });
    setModal(null);
    load();
  }

  async function remove() {
    if (!confirm(`Delete task "${modal.title}"?`)) return;
    await api(`/api/tasks/${modal.id}`, { method: "DELETE" });
    setModal(null);
    load();
  }

  return (
    <div className="content">
      <div className="page-head">
        <div><h1>{isAdmin ? "All tasks" : "My tasks"}</h1><p>Follow-ups, calls and to-dos linked to your contacts.</p></div>
        <div className="actions">
          {isAdmin && (
            <select aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} style={{ width: "auto" }}>
              <option value="">All owners</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <button className="btn" onClick={() => setModal("new")}><Icon name="plus" />Add task</button>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="toolbar">
          <div className="segmented" role="group" aria-label="Filter tasks">
            {Object.entries(VIEWS).map(([k, label]) => (
              <button key={k} aria-pressed={view === k} onClick={() => setView(k)}>{label}<span className="caption">{count(k)}</span></button>
            ))}
          </div>
        </div>
        {tasks === null && <p className="muted" style={{ padding: 24 }}>Loading...</p>}
        {tasks && shown.length === 0 && (
          <Empty icon="check-circle" title={view === "open" ? "You're all caught up" : "Nothing here"}
            action={<button className="btn sm" onClick={() => setModal("new")}><Icon name="plus" />Add task</button>}>
            No tasks in this view.
          </Empty>
        )}
        {shown.map((t) => {
          const due = t.done ? { text: "Done", tone: "muted" } : dueLabel(t.due_date);
          return (
            <div className={`task ${t.done ? "done" : ""}`} key={t.id}>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t)} aria-label={`Mark "${t.title}" done`} />
              <div className="grow">
                <span className="title">{t.title}</span>
                {t.description && <span className="small secondary">{t.description}</span>}
                <div className="meta">
                  <span className={`num t-${due.tone}`}><Icon name="calendar" size={14} />{due.text}</span>
                  {t.contact_name && <Link href={`/contacts/${t.contact_id}`}><Icon name="user" size={14} />{t.contact_name}</Link>}
                  <PriorityBadge priority={t.priority} />
                  {isAdmin && <span className="muted">Owner: {t.owner_name}</span>}
                </div>
              </div>
              <button className="btn ghost sm icon" onClick={() => setModal(t)} aria-label={`Edit "${t.title}"`}><Icon name="edit" /></button>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Add task" : "Edit task"} onClose={() => setModal(null)}>
          <EntityForm fields={taskFields(contacts, users)}
            initial={modal === "new" ? { owner_id: String(user.id), due_date: today() } : toForm(modal)}
            onSubmit={save} onCancel={() => setModal(null)} submitLabel={modal === "new" ? "Create task" : "Save changes"} />
          {modal !== "new" && (
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <button className="link-btn danger small" onClick={remove}>Delete task</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
