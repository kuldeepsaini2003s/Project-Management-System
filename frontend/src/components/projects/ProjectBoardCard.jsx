import { Calendar, Box } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import { PRIORITIES } from "../../constants/priority.js";

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

export default function ProjectBoardCard({ project, onOpen, dragging = false }) {
  const priority = PRIORITIES[project.priority] || PRIORITIES.NONE;
  const PIcon = priority.icon;

  const cls = dragging
    ? "block rounded-lg p-3 bg-surface border border-border-strong shadow-2xl cursor-grabbing"
    : "glass-card hover-lift block cursor-grab rounded-lg p-3 hover:bg-surface-hover active:cursor-grabbing";

  return (
    <div onClick={() => onOpen?.(project)} className={cls}>
      <div className="flex items-start gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm"
          style={{ backgroundColor: (project.color || "#5e6ad2") + "22", color: project.color || "#5e6ad2" }}
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
