"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Nav({ user }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <div className="nav">
      <div>
        <strong>Simple CRM</strong>
        <Link href="/">Contacts</Link>
        {user?.role === "admin" && <Link href="/admin">Users</Link>}
      </div>
      <div>
        {user && <span style={{ marginRight: 12 }}>{user.name} <span className={`badge ${user.role}`}>{user.role}</span></span>}
        <button className="small secondary" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
