import { PROJECT_STATUSES } from "../../constants/projectStatus.js";

export default function ProjectStatusBadge({ status, showLabel = true }) {
  const meta = PROJECT_STATUSES[status] || PROJECT_STATUSES.BACKLOG;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
      <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
      {showLabel && meta.label}
    </span>
  );
}
