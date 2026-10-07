import Icon from "./Icon";
import { STATUS_LABELS } from "@/lib/constants";

export function StatusBadge({ status }) {
  return <span className={`badge s-${status}`}><span className="dot" />{STATUS_LABELS[status] || status}</span>;
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge role-${role}`}>
      <Icon name={role === "admin" ? "shield" : "user"} size={12} />
      {role === "admin" ? "Admin" : "User"}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return <span className={`badge p-${priority}`}>{priority[0].toUpperCase() + priority.slice(1)} priority</span>;
}
