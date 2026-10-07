import { resource } from "./crud";
import { CONTACT_STATUSES, CONTACT_SOURCES, DEAL_STAGES, TASK_PRIORITIES } from "./constants";

export const contacts = resource({
  table: "contacts",
  fields: ["name", "email", "phone", "company", "job_title", "status", "source", "address"],
  required: ["name"],
  enums: { status: CONTACT_STATUSES, source: CONTACT_SOURCES },
  filters: ["status", "owner_id"],
  search: ["name", "email", "phone", "company"],
});

export const deals = resource({
  table: "deals",
  fields: ["title", "value", "stage", "expected_close", "contact_id"],
  required: ["title"],
  enums: { stage: DEAL_STAGES },
  cast: { value: "float8", expected_close: "text" },
  filters: ["stage", "owner_id", "contact_id"],
  search: ["title"],
  withContact: true,
});

export const tasks = resource({
  table: "tasks",
  fields: ["title", "description", "due_date", "priority", "done", "contact_id"],
  required: ["title"],
  enums: { priority: TASK_PRIORITIES },
  cast: { due_date: "text" },
  filters: ["done", "owner_id", "contact_id", "priority"],
  search: ["title", "description"],
  order: "t.done, t.due_date NULLS LAST, t.id DESC",
  withContact: true,
});
