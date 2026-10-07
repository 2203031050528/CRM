import { STATUSES, STATUS_LABELS, CONTACT_SOURCES, TASK_PRIORITIES } from "@/lib/constants";

const statusOptions = STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));

// Field sets shared between list and detail pages. Admins get an owner picker.
const ownerField = (users) =>
  users?.length ? [{ name: "owner_id", label: "Owner", type: "select", options: users.map((u) => ({ value: String(u.id), label: u.name })) }] : [];

const contactOptions = (contacts) => ({
  name: "contact_id", label: "Contact", type: "select", placeholder: "— None —",
  options: contacts.map((c) => ({ value: String(c.id), label: c.company ? `${c.name} (${c.company})` : c.name })),
});

export const contactFields = (users) => [
  { name: "name", label: "Full name", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "company", label: "Company" },
  { name: "job_title", label: "Job title" },
  { name: "status", label: "Status", type: "select", options: statusOptions, default: "new" },
  { name: "source", label: "Source", type: "select", options: CONTACT_SOURCES, placeholder: "— Select —" },
  ...ownerField(users),
  { name: "address", label: "Address", type: "textarea", full: true },
];

export const dealFields = (contacts, users) => [
  { name: "title", label: "Deal title", required: true, full: true },
  { name: "value", label: "Value (USD)", type: "number", min: 0, step: "0.01", default: "0" },
  { name: "stage", label: "Stage", type: "select", options: statusOptions, default: "new" },
  { name: "expected_close", label: "Expected close", type: "date" },
  contactOptions(contacts),
  ...ownerField(users),
];

export const taskFields = (contacts, users) => [
  { name: "title", label: "Task", required: true, full: true },
  { name: "due_date", label: "Due date", type: "date" },
  { name: "priority", label: "Priority", type: "select", options: TASK_PRIORITIES, default: "medium" },
  contactOptions(contacts),
  ...ownerField(users),
  { name: "description", label: "Description", type: "textarea", full: true },
];

// Turns a DB row into form values (ids as strings so selects match).
export const toForm = (row) =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v == null ? "" : k.endsWith("_id") ? String(v) : v]));
