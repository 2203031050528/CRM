"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, money, dueLabel } from "@/lib/client";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";
import { useUser } from "@/app/components/UserContext";
import Card, { Empty } from "@/app/components/Card";
import Icon from "@/app/components/Icon";
import Avatar from "@/app/components/Avatar";
import { StatusBadge, PriorityBadge } from "@/app/components/Badges";

export default function Dashboard() {
  const user = useUser();
  const isAdmin = user.role === "admin";
  const [s, setS] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api("/api/stats").then(setS).catch((e) => setError(e.message)); }, []);

  if (error) return <div className="content"><div className="banner error">{error}</div></div>;
  if (!s) return <div className="content"><p className="muted">Loading dashboard...</p></div>;

  const byStage = Object.fromEntries(s.deals.map((d) => [d.stage, d]));
  const byStatus = Object.fromEntries(s.contacts.map((c) => [c.status, c.count]));
  const totalContacts = s.contacts.reduce((n, c) => n + c.count, 0);
  const open = s.deals.filter((d) => !["won", "lost"].includes(d.stage));
  const openCount = open.reduce((n, d) => n + d.count, 0);
  const won = byStage.won || { count: 0, value: 0 };
  const lost = byStage.lost || { count: 0 };
  const totalDeals = s.deals.reduce((n, d) => n + d.count, 0);
  const maxWon = Math.max(1, ...s.team.map((u) => u.won_value));

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>{isAdmin ? "Team overview" : `Welcome back, ${user.name.split(" ")[0]}`}</h1>
          <p>{isAdmin ? "Everyone's contacts, deals and tasks." : "Your contacts, deals and tasks at a glance."}</p>
        </div>
        <Link href="/contacts?new=1" className="btn"><Icon name="plus" />Add contact</Link>
      </div>

      <div className="stats">
        <Stat label="Contacts" value={totalContacts} icon="users" accent foot={`${byStatus.won || 0} won · ${byStatus.new || 0} new`} />
        <Stat label="Open pipeline" value={money(open.reduce((n, d) => n + d.value, 0))} icon="pipeline" foot={`${openCount} open ${openCount === 1 ? "deal" : "deals"}`} />
        <Stat label="Won revenue" value={money(won.value)} icon="trophy" foot={`${won.count} won · ${lost.count} lost`} />
        <Stat label="Open tasks" value={s.tasks.open} icon="calendar"
          foot={<><span className={s.tasks.overdue ? "t-danger" : ""}>{s.tasks.overdue} overdue</span> · {s.tasks.today} due today</>} />
      </div>

      <Card title="Deals by stage" subtitle="Select a stage to open the pipeline board.">
        <div className="pipe-bar" role="img" aria-label="Deals by stage">
          {STATUSES.map((st) => byStage[st]?.count ? (
            <span key={st} style={{ flex: byStage[st].count, background: `var(--status-${st})` }} />
          ) : null)}
        </div>
        <div className="pipe-legend">
          {STATUSES.map((st) => (
            <Link key={st} href="/deals">
              <span className="lbl"><i style={{ background: `var(--status-${st})` }} />{STATUS_LABELS[st]}</span>
              <span className="val">{byStage[st]?.count || 0}</span>
              <span className="sub">{money(byStage[st]?.value)}{totalDeals ? ` · ${Math.round(((byStage[st]?.count || 0) / totalDeals) * 100)}%` : ""}</span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="row">
        <div className="wide-col">
          <Card title="Tasks due soon" subtitle="Open tasks, earliest first." raw
            footer={<Link href="/tasks" className="small">View all tasks</Link>}>
            {s.upcoming.length === 0 ? <Empty icon="check-circle" title="You're all caught up">No open tasks right now.</Empty> : (
              <ul className="list">
                {s.upcoming.map((t) => {
                  const due = dueLabel(t.due_date);
                  return (
                    <li key={t.id}>
                      <span className="stat-icon"><Icon name="clock" /></span>
                      <div className="grow"><b>{t.title}</b></div>
                      <PriorityBadge priority={t.priority} />
                      <span className={`small num t-${due.tone}`} style={{ minWidth: 96, textAlign: "right" }}>{due.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
        <div className="narrow-col">
          <Card title="Recent contacts" raw footer={<Link href="/contacts" className="small">View all contacts</Link>}>
            {s.recent.length === 0 ? <Empty icon="users" title="No contacts yet">Add your first contact to get started.</Empty> : (
              <ul className="list">
                {s.recent.map((c) => (
                  <li key={c.id}>
                    <Avatar name={c.name} size={32} />
                    <Link href={`/contacts/${c.id}`} className="grow list-link"><b>{c.name}</b><span className="small muted">{c.company || "No company"}</span></Link>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {isAdmin && (
        <div className="row">
          <div className="wide-col">
            <Card title="Team performance" raw>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Owner</th><th className="r">Contacts</th><th className="r">Open deals</th><th className="r">Won revenue</th></tr></thead>
                  <tbody>
                    {s.team.map((u) => (
                      <tr key={u.id}>
                        <td><div className="cell-person"><Avatar name={u.name} size={28} /><b>{u.name}</b></div></td>
                        <td className="r num">{u.contacts}</td>
                        <td className="r num">{u.open_deals}</td>
                        <td className="r num strong" style={{ color: "var(--text)" }}>{money(u.won_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <div className="narrow-col">
            <Card title="Won revenue by owner">
              <div className="bar-list">
                {s.team.map((u) => (
                  <div className="bar-item" key={u.id}>
                    <div className="top"><span>{u.name}</span><span>{money(u.won_value)}</span></div>
                    <div className="bar-track"><div style={{ width: `${(u.won_value / maxWon) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, foot, accent }) {
  return (
    <div className={`card stat ${accent ? "accent" : ""}`}>
      <div className="stat-top">{label}<span className="stat-icon"><Icon name={icon} /></span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </div>
  );
}
