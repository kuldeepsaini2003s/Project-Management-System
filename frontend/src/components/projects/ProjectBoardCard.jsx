import { Calendar, Box } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import { PRIORITIES } from "../../constants/priority.js";

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

const STATUS_GRADIENTS = {
  BACKLOG:     "linear-gradient(135deg, rgba(148,163,184,0.55) 0%, rgba(100,116,139,0.25) 100%)",
  PLANNED:     "linear-gradient(135deg, rgba(99,102,241,0.60) 0%, rgba(139,92,246,0.30) 100%)",
  IN_PROGRESS: "linear-gradient(135deg, rgba(245,158,11,0.65) 0%, rgba(251,191,36,0.30) 100%)",
  COMPLETED:   "linear-gradient(135deg, rgba(34,197,94,0.60) 0%, rgba(16,185,129,0.28) 100%)",
  CANCELLED:   "linear-gradient(135deg, rgba(239,68,68,0.60) 0%, rgba(244,63,94,0.28) 100%)",
};

const STATUS_BORDER = {
  BACKLOG:     "rgba(148,163,184,0.90)",
  PLANNED:     "rgba(99,102,241,0.95)",
  IN_PROGRESS: "rgba(245,158,11,1.00)",
  COMPLETED:   "rgba(34,197,94,0.95)",
  CANCELLED:   "rgba(239,68,68,0.95)",
};

export default function ProjectBoardCard({ project, onOpen, dragging = false }) {
  const priority = PRIORITIES[project.priority] || PRIORITIES.NONE;
  const PIcon = priority.icon;

  const gradient = STATUS_GRADIENTS[project.status] || STATUS_GRADIENTS.BACKLOG;
  const borderColor = STATUS_BORDER[project.status] || STATUS_BORDER.BACKLOG;

  const style = dragging
    ? { background: gradient, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }
    : { background: gradient, border: `1px solid ${borderColor}` };

  const cls = dragging
    ? "block rounded-lg p-3 shadow-2xl cursor-grabbing"
    : "hover-lift block cursor-grab rounded-lg p-3 active:cursor-grabbing transition-shadow";

  return (
    <div onClick={() => onOpen?.(project)} className={cls} style={style}>
      <div className="flex items-start gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm"
          style={{ backgroundColor: (project.color || "#5e6ad2") + "33", color: project.color || "#5e6ad2" }}
        >
          {project.icon ? (
            <span aria-hidden="true">{project.icon}</span>
          ) : (
            <Box className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{project.name}</h3>
        {project.priority && project.priority !== "NONE" && (
          <PIcon className="h-3.5 w-3.5 shrink-0" style={{ color: priority.color }} title={priority.label} />
        )}
        {project.lead && (
          <Avatar name={project.lead.name} src={project.lead.avatarUrl} size="sm" />
        )}
      </div>

      {project.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-fg-muted">
          {project.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-fg-subtle">
        {project.targetDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {fmtDate(project.targetDate)}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-fg-muted">{project.issueCount ?? 0} issues</p>
    </div>
  );
}
