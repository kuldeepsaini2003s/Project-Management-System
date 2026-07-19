import {
  Circle,
  CircleDashed,
  CircleDot,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const PROJECT_STATUSES = {
  BACKLOG: { label: "Backlog", color: "var(--fg-subtle)", icon: CircleDashed },
  PLANNED: { label: "Planned", color: "#9ca0a8", icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "var(--warning)", icon: CircleDot },
  COMPLETED: { label: "Completed", color: "var(--brand)", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "var(--danger)", icon: XCircle },
};

export const STATUS_ORDER = [
  "BACKLOG",
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];
