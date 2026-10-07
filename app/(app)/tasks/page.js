"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, fmtDate, isOverdue, today } from "@/lib/client";
import { useUser } from "@/app/components/UserContext";
import { useOptions } from "@/app/components/useOptions";
import { taskFields, toForm } from "@/app/components/forms";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";

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
    <>
      <div className="page-head">
        <div><h1>Tasks</h1><p>Follow-ups, calls and to-dos.</p></div>
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin && (
            <select value={owner} onChange={(e) => setOwner(e.target.value)} style={{ width: "auto" }}>
              <option value="">All owners</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <button className="btn" onClick={() => setModal("new")}>+ New task</button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="tabs">
            {Object.entries(VIEWS).map(([k, label]) => (
              <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)}>{label} ({count(k)})</button>
            ))}
          </div>
        </div>
        {tasks === null && <div className="empty">Loading...</div>}
        {tasks && shown.length === 0 && <div className="empty">Nothing here.</div>}
        {shown.map((t) => (
          <div className={`task-row ${t.done ? "done" : ""}`} key={t.id}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t)} aria-label="Mark done" />
            <div className="body">
              <div className="title"><button className="link-btn" style={{ color: "inherit", fontWeight: 500 }} onClick={() => setModal(t)}>{t.title}</button></div>
              {t.description && <div className="muted" style={{ marginTop: 2 }}>{t.description}</div>}
              <div className="meta">
                <span className={isOverdue(t) ? "badge b-overdue" : ""}>Due {fmtDate(t.due_date)}</span>
                <span className={`badge b-${t.priority}`}>{t.priority}</span>
                {t.contact_name && <Link href={`/contacts/${t.contact_id}`}>{t.contact_name}</Link>}
                {isAdmin && <span>Owner: {t.owner_name}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "new" ? "New task" : "Edit task"} onClose={() => setModal(null)}>
          <EntityForm fields={taskFields(contacts, users)}
            initial={modal === "new" ? { owner_id: String(user.id), due_date: today() } : toForm(modal)}
            onSubmit={save} onCancel={() => setModal(null)} submitLabel={modal === "new" ? "Create task" : "Save"} />
          {modal !== "new" && (
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button className="link-btn danger" onClick={remove}>Delete task</button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
