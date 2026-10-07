"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useUser } from "@/app/components/UserContext";

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
      setMsg({ name: "Profile updated." });
      router.refresh();
    } catch (err) {
      setMsg({ nameErr: err.message });
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return setMsg({ pwErr: "New passwords do not match" });
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
    <>
      <div className="page-head"><div><h1>Profile</h1><p>Manage your account settings.</p></div></div>
      <div className="grid two">
        <form className="card" onSubmit={saveName}>
          <h2>Account</h2>
          <div className="form-grid">
            <label className="field full"><span>Full name</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label className="field"><span>Email</span><input value={user.email} disabled /></label>
            <label className="field"><span>Role</span><input value={user.role} disabled style={{ textTransform: "capitalize" }} /></label>
          </div>
          {msg.name && <div className="success">{msg.name}</div>}
          {msg.nameErr && <div className="error">{msg.nameErr}</div>}
          <div className="form-actions"><button className="btn">Save</button></div>
        </form>
        <form className="card" onSubmit={savePassword}>
          <h2>Change password</h2>
          <div className="form-grid">
            <label className="field full"><span>Current password</span><input type="password" value={pw.currentPassword} onChange={setP("currentPassword")} required autoComplete="current-password" /></label>
            <label className="field"><span>New password</span><input type="password" value={pw.newPassword} onChange={setP("newPassword")} required minLength={6} autoComplete="new-password" /></label>
            <label className="field"><span>Confirm new password</span><input type="password" value={pw.confirm} onChange={setP("confirm")} required autoComplete="new-password" /></label>
          </div>
          {msg.pw && <div className="success">{msg.pw}</div>}
          {msg.pwErr && <div className="error">{msg.pwErr}</div>}
          <div className="form-actions"><button className="btn">Update password</button></div>
        </form>
      </div>
    </>
  );
}
