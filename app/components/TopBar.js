"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "./UserContext";
import Avatar from "./Avatar";
import Icon from "./Icon";

const TITLES = { "/": "Dashboard", "/contacts": "Contacts", "/deals": "Deals", "/tasks": "Tasks", "/admin/users": "Users", "/profile": "Profile" };

function crumbsFor(path) {
  if (path.startsWith("/contacts/")) return [{ label: "Contacts", href: "/contacts" }, { label: "Contact" }];
  if (path.startsWith("/admin")) return [{ label: "Admin" }, { label: TITLES[path] || "Admin" }];
  return [{ label: TITLES[path] || "" }];
}

export default function TopBar() {
  const user = useUser();
  const crumbs = crumbsFor(usePathname());
  return (
    <header className="topbar">
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 && <Icon name="chevron-right" size={14} />}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span className={i === crumbs.length - 1 ? "current" : ""}>{c.label}</span>}
          </span>
        ))}
      </nav>
      <div className="user-chip">
        <div className="who"><b>{user.name}</b><span className="caption muted">{user.role === "admin" ? "Admin" : "User"}</span></div>
        <Avatar name={user.name} size={32} />
      </div>
    </header>
  );
}
