"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "./UserContext";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/contacts", label: "Contacts", icon: "☺" },
  { href: "/deals", label: "Deals", icon: "$" },
  { href: "/tasks", label: "Tasks", icon: "✓" },
];

export default function Sidebar() {
  const user = useUser();
  const path = usePathname();
  const active = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  const link = (l) => (
    <Link key={l.href} href={l.href} className={`nav-link ${active(l.href) ? "active" : ""}`}>
      <span>{l.icon}</span>{l.label}
    </Link>
  );

  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">C</span>Simple CRM</div>
      <div className="nav-section">Workspace</div>
      {LINKS.map(link)}
      {user.role === "admin" && (
        <>
          <div className="nav-section">Admin</div>
          {link({ href: "/admin/users", label: "Users", icon: "⚙" })}
        </>
      )}
      <div className="nav-section">Account</div>
      {link({ href: "/profile", label: "Profile", icon: "◉" })}
      <div className="side-foot">
        <div className="who">{user.name} <span className={`badge b-${user.role}`}>{user.role}</span></div>
        <div className="email">{user.email}</div>
        <a href="/api/auth/logout" className="btn ghost sm">Log out</a>
      </div>
    </aside>
  );
}
