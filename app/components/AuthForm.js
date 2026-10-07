"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import Icon from "./Icon";
import { Brand } from "./Sidebar";

function Field({ label, icon, hint, ...props }) {
  return (
    <label className="field">
      <span>{label}{props.required && <span className="req"> *</span>}</span>
      {icon ? <div className="input-icon"><Icon name={icon} />{<input {...props} />}</div> : <input {...props} />}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export default function AuthForm({ mode }) {
  const signup = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (signup && form.password !== form.confirm) return setError("Passwords don't match. Type the same password twice.");
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
    <div className="auth">
      <div className="auth-wrap" style={{ maxWidth: signup ? 440 : 400 }}>
        <Brand />
        <div className="card auth-card">
          <div>
            <h1>{signup ? "Create your account" : "Sign in to your account"}</h1>
            <p className="intro">{signup ? "You'll start as a user and see only the contacts, deals and tasks you own." : "Pick up where you left off with your contacts and deals."}</p>
          </div>
          {error && <div className="banner error" role="alert"><Icon name="x" />{error}</div>}
          <form onSubmit={submit}>
            {signup && <Field label="Full name" icon="user" value={form.name} onChange={set("name")} required autoFocus autoComplete="name" />}
            <Field label="Work email" icon="mail" type="email" placeholder="name@company.com" value={form.email} onChange={set("email")} required autoFocus={!signup} autoComplete="email" />
            {signup ? (
              <div className="form-grid">
                <Field label="Password" type="password" value={form.password} onChange={set("password")} required minLength={6} hint="At least 6 characters." autoComplete="new-password" />
                <Field label="Confirm password" type="password" value={form.confirm} onChange={set("confirm")} required autoComplete="new-password" />
              </div>
            ) : (
              <Field label="Password" icon="lock" type="password" placeholder="Your password" value={form.password} onChange={set("password")} required autoComplete="current-password" />
            )}
            <button className="btn block" disabled={busy}>{busy ? "Please wait..." : signup ? "Create account" : "Sign in"}</button>
          </form>
        </div>
        <p className="auth-switch">
          {signup ? <>Already have an account? <Link href="/login">Sign in</Link></>
                  : <>New here? <Link href="/signup">Create an account</Link></>}
        </p>
      </div>
    </div>
  );
}
