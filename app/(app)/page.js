"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, money, fmtDate, today } from "@/lib/client";
import { DEAL_STAGES, CONTACT_STATUSES } from "@/lib/constants";
import { useUser } from "@/app/components/UserContext";

export default function Dashboard() {
  const user = useUser();
  const [s, setS] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api("/api/stats").then(setS).catch((e) => setError(e.message)); }, []);

  if (error) return <div className="error">{error}</div>;
  if (!s) return <div className="muted">Loading dashboard...</div>;

  const byStage = Object.fromEntries(s.deals.map((d) => [d.stage, d]));
  const byStatus = Object.fromEntries(s.contacts.map((c) => [c.status, c.count]));
  const totalContacts = s.contacts.reduce((n, c) => n + c.count, 0);
  const open = s.deals.filter((d) => !["won", "lost"].includes(d.stage));
  const openValue = open.reduce((n, d) => n + d.value, 0);
  const won = byStage.won || { count: 0, value: 0 };
  const lost = byStage.lost || { count: 0 };
  const winRate = won.count + lost.count ? Math.round((won.count / (won.count + lost.count)) * 100) : 0;
  const maxStage = Math.max(1, ...DEAL_STAGES.map((st) => byStage[st]?.value || 0));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {user.name.split(" ")[0]}</h1>
          <p>{user.role === "admin" ? "Overview of the whole team." : "Here's what's happening with your customers."}</p>
        </div>
      </div>

      <div className="grid kpi">
        <Kpi label="Contacts" value={totalContacts} sub={`${byStatus.customer || 0} customers`} />
        <Kpi label="Open pipeline" value={money(openValue)} sub={`${open.reduce((n, d) => n + d.count, 0)} open deals`} />
        <Kpi label="Won revenue" value={money(won.value)} sub={`${won.count} deals · ${winRate}% win rate`} />
        <Kpi label="Open tasks" value={s.tasks.open} sub={<><span style={{ color: s.tasks.overdue ? "var(--danger)" : undefined }}>{s.tasks.overdue} overdue</span> · {s.tasks.today} due today</>} />
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Pipeline by stage</h2>
          {DEAL_STAGES.map((st) => (
            <div className="bar-row" key={st}>
              <span>{st} <span className="muted">({byStage[st]?.count || 0})</span></span>
              <div className="bar"><div style={{ width: `${((byStage[st]?.value || 0) / maxStage) * 100}%` }} /></div>
              <span className="num">{money(byStage[st]?.value)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Contacts by status</h2>
          {CONTACT_STATUSES.map((st) => (
            <div className="bar-row" key={st}>
              <span>{st}</span>
              <div className="bar"><div style={{ width: `${totalContacts ? ((byStatus[st] || 0) / totalContacts) * 100 : 0}%` }} /></div>
              <span className="num">{byStatus[st] || 0}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="page-head" style={{ marginBottom: 6 }}><h2 style={{ margin: 0 }}>Upcoming tasks</h2><Link href="/tasks">View all</Link></div>
          {s.upcoming.length === 0 && <div className="empty">No open tasks 🎉</div>}
          {s.upcoming.map((t) => (
            <div className="list-item" key={t.id}>
              <span>{t.title}</span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={t.due_date && t.due_date < today() ? "badge b-overdue" : "muted"}>{fmtDate(t.due_date)}</span>
                <span className={`badge b-${t.priority}`}>{t.priority}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="page-head" style={{ marginBottom: 6 }}><h2 style={{ margin: 0 }}>Recent contacts</h2><Link href="/contacts">View all</Link></div>
          {s.recent.length === 0 && <div className="empty">No contacts yet. <Link href="/contacts">Add one</Link></div>}
          {s.recent.map((c) => (
            <Link className="list-item" key={c.id} href={`/contacts/${c.id}`} style={{ color: "inherit" }}>
              <span><strong>{c.name}</strong>{c.company && <span className="muted"> · {c.company}</span>}</span>
              <span className={`badge b-${c.status}`}>{c.status}</span>
            </Link>
          ))}
        </div>
      </div>

      {user.role === "admin" && (
        <div className="card">
          <h2>Team performance</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Contacts</th><th>Open deals</th><th>Won revenue</th></tr></thead>
              <tbody>
                {s.team.map((u) => (
                  <tr key={u.id}><td>{u.name}</td><td>{u.contacts}</td><td>{u.open_deals}</td><td>{money(u.won_value)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div className="kpi-tile">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}
