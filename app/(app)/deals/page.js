"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, money, shortDate, today } from "@/lib/client";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";
import { useUser } from "@/app/components/UserContext";
import { useOptions } from "@/app/components/useOptions";
import { dealFields, toForm } from "@/app/components/forms";
import Modal from "@/app/components/Modal";
import EntityForm from "@/app/components/EntityForm";
import Icon from "@/app/components/Icon";

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
  const now = today();

  return (
    <div className="content wide">
      <div className="page-head">
        <div>
          <h1>Deals pipeline</h1>
          <p>{open.length} open {open.length === 1 ? "deal" : "deals"} worth {money(open.reduce((n, d) => n + d.value, 0))}. Drag a card to move it to another stage.</p>
        </div>
        <div className="actions">
          {isAdmin && (
            <select aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} style={{ width: "auto" }}>
              <option value="">All owners</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <button className="btn" onClick={() => setModal("new")}><Icon name="plus" />Add deal</button>
        </div>
      </div>
      {error && <div className="banner error">{error}</div>}

      {!deals ? <p className="muted">Loading...</p> : (
        <div className="board-scroll">
          <div className="board">
            {STATUSES.map((stage) => {
              const items = deals.filter((d) => d.stage === stage);
              return (
                <section key={stage} className={`column ${over === stage ? "over" : ""}`} aria-label={STATUS_LABELS[stage]}
                  onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
                  onDragLeave={() => setOver(null)}
                  onDrop={() => moveTo(stage)}>
                  <header className="column-head">
                    <div className="t"><i style={{ background: `var(--status-${stage})` }} />{STATUS_LABELS[stage]}<span className="caption num">{items.length}</span></div>
                    <div className="total">{money(items.reduce((n, d) => n + d.value, 0))}</div>
                  </header>
                  {items.map((d) => {
                    const late = d.expected_close && d.expected_close < now && !["won", "lost"].includes(d.stage);
                    return (
                      <button key={d.id} className="deal-card" draggable onDragStart={() => setDragId(d.id)} onClick={() => setModal(d)}>
                        <span className="title">{d.title}</span>
                        <span className="value">{money(d.value)}</span>
                        <span className="meta">
                          <span>{d.contact_name || "No contact"}</span>
                          <span className={`num ${late ? "t-danger" : "t-muted"}`}>{shortDate(d.expected_close)}</span>
                        </span>
                        {isAdmin && <span className="meta"><span>{d.owner_name}</span></span>}
                      </button>
                    );
                  })}
                  {items.length === 0 && <p className="small muted" style={{ textAlign: "center", padding: "16px 0" }}>No deals</p>}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal === "new" ? "Add deal" : "Edit deal"} onClose={() => setModal(null)}>
          <EntityForm fields={dealFields(contacts, users)}
            initial={modal === "new" ? { owner_id: String(user.id) } : toForm(modal)}
            onSubmit={save} onCancel={() => setModal(null)} submitLabel={modal === "new" ? "Create deal" : "Save changes"} />
          {modal !== "new" && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              {modal.contact_id ? <Link href={`/contacts/${modal.contact_id}`} className="small">Open contact</Link> : <span />}
              <button className="link-btn danger small" onClick={remove}>Delete deal</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
