import { CircleDashed, Circle, CircleDot, CheckCircle2, XCircle } from "lucide-react";

export const ISSUE_STATUSES = {
  BACKLOG: { label: "Backlog", icon: CircleDashed, color: "var(--fg-subtle)" },
  TODO: { label: "Todo", icon: Circle, color: "#9ca0a8" },
  IN_PROGRESS: { label: "In Progress", icon: CircleDot, color: "#e0a52a" },
  DONE: { label: "Done", icon: CheckCircle2, color: "var(--brand)" },
  CANCELLED: { label: "Cancelled", icon: XCircle, color: "var(--fg-subtle)" },
};

// Column order for the board.
export const ISSUE_STATUS_ORDER = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
