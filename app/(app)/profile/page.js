"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useUser } from "@/app/components/UserContext";
import Card from "@/app/components/Card";
import Avatar from "@/app/components/Avatar";
import { RoleBadge } from "@/app/components/Badges";

export default function ProfilePage() {
  const user = useUser();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [msg, setMsg] = useState({});

  async function saveName(e) {
    e.preventDefault();
    try {
      await api("/api/me", { method: "PATCH", body: { name } });
      setMsg({ name: "Changes saved." });
      router.refresh();
    } catch (err) {
      setMsg({ nameErr: err.message });
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return setMsg({ pwErr: "New passwords don't match. Type the same password twice." });
    try {
      await api("/api/me", { method: "PATCH", body: pw });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      setMsg({ pw: "Password changed." });
    } catch (err) {
      setMsg({ pwErr: err.message });
    }
  }

  const setP = (k) => (e) => setPw({ ...pw, [k]: e.target.value });

  return (
    <div className="content">
      <div className="page-head" style={{ alignItems: "center" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar name={user.name} size={56} />
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}><h1>{user.name}</h1><RoleBadge role={user.role} /></div>
            <p>{user.email}</p>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="narrow-col">
          <Card title="Account" subtitle="Your name is shown on notes and records you own.">
            <form onSubmit={saveName}>
              <div className="form-grid">
                <label className="field full"><span>Full name</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
                <label className="field full"><span>Email</span><input value={user.email} disabled /></label>
              </div>
              {msg.name && <div className="banner success" style={{ marginTop: 16 }}>{msg.name}</div>}
              {msg.nameErr && <div className="banner error" style={{ marginTop: 16 }}>{msg.nameErr}</div>}
              <div className="form-actions"><button className="btn">Save changes</button></div>
            </form>
          </Card>
        </div>
        <div className="narrow-col">
          <Card title="Change password" subtitle="You'll need your current password.">
            <form onSubmit={savePassword}>
              <div className="form-grid">
                <label className="field full"><span>Current password</span><input type="password" value={pw.currentPassword} onChange={setP("currentPassword")} required autoComplete="current-password" /></label>
                <label className="field"><span>New password</span><input type="password" value={pw.newPassword} onChange={setP("newPassword")} required minLength={6} autoComplete="new-password" /><span className="hint">At least 6 characters.</span></label>
                <label className="field"><span>Confirm new password</span><input type="password" value={pw.confirm} onChange={setP("confirm")} required autoComplete="new-password" /></label>
              </div>
              {msg.pw && <div className="banner success" style={{ marginTop: 16 }}>{msg.pw}</div>}
              {msg.pwErr && <div className="banner error" style={{ marginTop: 16 }}>{msg.pwErr}</div>}
              <div className="form-actions"><button className="btn">Update password</button></div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
