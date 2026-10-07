// Browser-side helpers shared by pages.
export async function api(url, { method = "GET", body } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.startsWith("/api/auth")) window.location.href = "/api/auth/logout";
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n) || 0);

const toDate = (d) => new Date(d.length === 10 ? d + "T00:00:00" : d);

// Day-month dates: "7 Oct 2026" in fields, "7 Oct" in tables.
export const fmtDate = (d) => (d ? toDate(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const shortDate = (d) => (d ? toDate(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const isOverdue = (t) => !t.done && t.due_date && t.due_date < today();

// "Today", "Tomorrow", "3 days overdue", otherwise a short date.
export function dueLabel(due) {
  if (!due) return { text: "No due date", tone: "muted" };
  const days = Math.round((toDate(due) - toDate(today())) / 86400000);
  if (days < 0) return { text: days === -1 ? "1 day overdue" : `${-days} days overdue`, tone: "danger" };
  if (days === 0) return { text: "Today", tone: "accent" };
  if (days === 1) return { text: "Tomorrow", tone: "plain" };
  return { text: shortDate(due), tone: "plain" };
}

export function downloadCsv(filename, rows, columns) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [columns.map((c) => esc(c.label)), ...rows.map((r) => columns.map((c) => esc(r[c.key])))]
    .map((r) => r.join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
