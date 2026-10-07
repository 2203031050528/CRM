"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

export default function AuthForm({ mode }) {
  const signup = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (signup && form.password !== form.confirm) return setError("Passwords do not match");
    setBusy(true);
    try {
      await api(signup ? "/api/auth/signup" : "/api/auth/login", { method: "POST", body: form });
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-box">
      <h2>{signup ? "Create your account" : "Welcome back"}</h2>
      <div className="muted">{signup ? "Start managing your customers in minutes." : "Sign in to continue to your CRM."}</div>
      <form onSubmit={submit}>
        {signup && (
          <label className="field"><span>Full name</span>
            <input value={form.name} onChange={set("name")} required autoFocus />
          </label>
        )}
        <label className="field"><span>Email</span>
          <input type="email" value={form.email} onChange={set("email")} required autoFocus={!signup} autoComplete="email" />
        </label>
        <label className="field"><span>Password</span>
          <input type="password" value={form.password} onChange={set("password")} required minLength={signup ? 6 : undefined}
            autoComplete={signup ? "new-password" : "current-password"} />
        </label>
        {signup && (
          <label className="field"><span>Confirm password</span>
            <input type="password" value={form.confirm} onChange={set("confirm")} required autoComplete="new-password" />
          </label>
        )}
        <button className="btn block" disabled={busy}>{busy ? "Please wait..." : signup ? "Create account" : "Sign in"}</button>
        {error && <div className="error">{error}</div>}
      </form>
      <div className="switch">
        {signup ? <>Already have an account? <Link href="/login">Sign in</Link></>
                : <>Don&apos;t have an account? <Link href="/signup">Sign up</Link></>}
      </div>
    </div>
  );
}
