"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "./UserContext";
import Icon from "./Icon";

const WORKSPACE = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/contacts", label: "Contacts", icon: "users" },
  { href: "/deals", label: "Deals", icon: "pipeline" },
  { href: "/tasks", label: "Tasks", icon: "check-circle" },
];

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark"><Icon name="pipeline" size={16} /></span>
      Simple CRM
    </div>
  );
}

export default function Sidebar() {
  const user = useUser();
  const path = usePathname();
  const isActive = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  const link = (l) => (
    <Link key={l.href} href={l.href} className={`nav-link ${isActive(l.href) ? "active" : ""}`}
      aria-current={isActive(l.href) ? "page" : undefined}>
      <Icon name={l.icon} size={18} />{l.label}
    </Link>
  );

  return (
    <nav className="sidebar" aria-label="Main">
      <Brand />
      <div className="nav-section">Workspace</div>
      {WORKSPACE.map(link)}
      {user.role === "admin" && (
        <>
          <div className="nav-section">Admin</div>
          {link({ href: "/admin/users", label: "Users", icon: "shield" })}
        </>
      )}
      <div className="nav-section">Account</div>
      {link({ href: "/profile", label: "Profile", icon: "user" })}
      <div className="side-foot">
        <a href="/api/auth/logout" className="nav-link"><Icon name="logout" size={18} />Sign out</a>
      </div>
    </nav>
  );
}
