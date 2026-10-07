"use client";
import { useState } from "react";

// Renders a form from field definitions: { name, label, type, options, required, full }.
export default function EntityForm({ fields, initial = {}, onSubmit, onCancel, submitLabel = "Save" }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? f.default ?? ""])));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const input = (f) => {
    const props = { value: values[f.name] ?? "", required: f.required, onChange: (e) => setValues({ ...values, [f.name]: e.target.value }) };
    if (f.type === "select") {
      return (
        <select {...props}>
          {f.placeholder !== undefined && <option value="">{f.placeholder}</option>}
          {f.options.map((o) => {
            const [value, label] = typeof o === "object" ? [o.value, o.label] : [o, o[0].toUpperCase() + o.slice(1)];
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>
      );
    }
    if (f.type === "textarea") return <textarea {...props} />;
    return <input {...props} type={f.type || "text"} min={f.min} step={f.step} minLength={f.minLength} />;
  };

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f.name} className={`field ${f.full ? "full" : ""}`}>
            <span>{f.label}{f.required && " *"}</span>
            {input(f)}
          </label>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="form-actions">
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn" disabled={busy}>{busy ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
}
