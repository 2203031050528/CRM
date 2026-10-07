// One pipeline (LeadDesk statuses) shared by contacts and deals, in pipeline order.
export const STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"];
export const STATUS_LABELS = { new: "New", contacted: "Contacted", qualified: "Qualified", proposal: "Proposal", won: "Won", lost: "Lost" };
export const CONTACT_STATUSES = STATUSES;
export const DEAL_STAGES = STATUSES;
export const CONTACT_SOURCES = ["website", "referral", "social", "email", "event", "other"];
export const TASK_PRIORITIES = ["low", "medium", "high"];
export const ROLES = ["user", "admin"];
