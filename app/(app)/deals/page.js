"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, money, fmtDate } from "@/lib/client";
import { DEAL_STAGES } from "@/lib/constants";
import { useUser } from "@/app/components/UserContext";
import { useOptions } from "@/app/components/useOptions";
import { dealFields, toForm } from "@/app/components/forms";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";

export default function DealsPage() {
  const user = useUser();
  const isAdmin = user.role === "admin";
  const { contacts, users } = useOptions();
  const [deals, setDeals] = useState(null);
  const [owner, setOwner] = useState("");
  const [modal, setModal] = useState(null); // "new" | deal object
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api(`/api/deals${owner ? `?owner_id=${owner}` : ""}`).then(setDeals).catch((e) => setError(e.message));
  }, [owner]);
  useEffect(() => { load(); }, [load]);

  async function save(values) {
    const body = { ...values, value: values.value || 0 };
    if (modal === "new") await api("/api/deals", { method: "POST", body });
    else await api(`/api/deals/${modal.id}`, { method: "PUT", body });
    setModal(null);
    load();
  }

  async function remove() {
    if (!confirm(`Delete deal "${modal.title}"?`)) return;
    await api(`/api/deals/${modal.id}`, { method: "DELETE" });
    setModal(null);
    load();
  }

  async function moveTo(stage) {
    setOver(null);
    const deal = deals.find((d) => d.id === dragId);
    if (!deal || deal.stage === stage) return;
    setDeals(deals.map((d) => (d.id === deal.id ? { ...d, stage } : d)));
    try {
      await api(`/api/deals/${deal.id}`, { method: "PUT", body: { stage } });
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  const open = (deals || []).filter((d) => !["won", "lost"].includes(d.stage));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Deals pipeline</h1>
          <p>{open.length} open deals worth {money(open.reduce((n, d) => n + d.value, 0))}. Drag cards between stages.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin && (
            <select value={owner} onChange={(e) => setOwner(e.target.value)} style={{ width: "auto" }}>
              <option value="">All owners</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <button className="btn" onClick={() => setModal("new")}>+ New deal</button>
        </div>
      </div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

      {!deals ? <div className="muted">Loading...</div> : (
        <div className="board">
          {DEAL_STAGES.map((stage) => {
            const items = deals.filter((d) => d.stage === stage);
            return (
              <div key={stage} className={`column ${over === stage ? "over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
                onDragLeave={() => setOver(null)}
                onDrop={() => moveTo(stage)}>
                <div className="column-head">
                  <strong>{stage} <span className="muted">({items.length})</span></strong>
                  <span className="muted">{money(items.reduce((n, d) => n + d.value, 0))}</span>
                </div>
                {items.map((d) => (
                  <div key={d.id} className="deal-card" draggable onDragStart={() => setDragId(d.id)} onClick={() => setModal(d)}>
                    <div className="title">{d.title}</div>
                    <div className="value">{money(d.value)}</div>
                    <div className="meta">
                      <span>{d.contact_name || "No contact"}</span>
                      <span>{fmtDate(d.expected_close)}</span>
                    </div>
                    {isAdmin && <div className="meta"><span>Owner: {d.owner_name}</span></div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === "new" ? "New deal" : "Edit deal"} onClose={() => setModal(null)}>
          <EntityForm fields={dealFields(contacts, users)}
            initial={modal === "new" ? { owner_id: String(user.id) } : toForm(modal)}
            onSubmit={save} onCancel={() => setModal(null)} submitLabel={modal === "new" ? "Create deal" : "Save"} />
          {modal !== "new" && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              {modal.contact_id ? <Link href={`/contacts/${modal.contact_id}`}>Open contact →</Link> : <span />}
              <button className="link-btn danger" onClick={remove}>Delete deal</button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
