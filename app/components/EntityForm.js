"use client";
import { useState } from "react";
import Icon from "./Icon";

// Renders a form from field definitions: { name, label, type, options, required, full, hint }.
export default function EntityForm({ fields, initial = {}, onSubmit, onCancel, submitLabel = "Save changes" }) {
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
    const props = { id: `f-${f.name}`, value: values[f.name] ?? "", required: f.required, onChange: (e) => setValues({ ...values, [f.name]: e.target.value }) };
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
      {error && <div className="banner error" style={{ marginBottom: 16 }}><Icon name="x" />{error}</div>}
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f.name} className={`field ${f.full ? "full" : ""}`} htmlFor={`f-${f.name}`}>
            <span>{f.label}{f.required && <span className="req"> *</span>}</span>
            {input(f)}
            {f.hint && <span className="hint">{f.hint}</span>}
          </label>
        ))}
      </div>
      <div className="form-actions">
        {onCancel && <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>}
        <button className="btn" disabled={busy}>{busy ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
}
