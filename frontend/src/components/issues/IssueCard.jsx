import { Box } from "lucide-react";
import { PRIORITIES } from "../../constants/priority.js";
import Avatar from "../ui/Avatar.jsx";

const STATUS_GRADIENTS = {
  BACKLOG:     "linear-gradient(135deg, rgba(148,163,184,0.30) 0%, rgba(100,116,139,0.10) 100%)",
  TODO:        "linear-gradient(135deg, rgba(59,130,246,0.30) 0%, rgba(99,102,241,0.10) 100%)",
  IN_PROGRESS: "linear-gradient(135deg, rgba(245,158,11,0.35) 0%, rgba(251,191,36,0.12) 100%)",
  DONE:        "linear-gradient(135deg, rgba(34,197,94,0.32) 0%, rgba(16,185,129,0.10) 100%)",
  CANCELLED:   "linear-gradient(135deg, rgba(239,68,68,0.32) 0%, rgba(244,63,94,0.10) 100%)",
};

const STATUS_BORDER = {
  BACKLOG:     "rgba(148,163,184,0.35)",
  TODO:        "rgba(59,130,246,0.40)",
  IN_PROGRESS: "rgba(245,158,11,0.45)",
  DONE:        "rgba(34,197,94,0.40)",
  CANCELLED:   "rgba(239,68,68,0.38)",
};

export default function IssueCard({ issue, onClick, showProject = true, dragging = false }) {
  const priority = PRIORITIES[issue.priority] || PRIORITIES.NONE;
  const PIcon = priority.icon;

  const gradient = STATUS_GRADIENTS[issue.status] || STATUS_GRADIENTS.BACKLOG;
  const borderColor = STATUS_BORDER[issue.status] || STATUS_BORDER.BACKLOG;

  const style = dragging
    ? { background: gradient, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }
    : { background: gradient, border: `1px solid ${borderColor}` };

  const cls = dragging
    ? "rounded-lg p-3 shadow-2xl cursor-grabbing"
    : "hover-lift group cursor-grab rounded-lg p-3 active:cursor-grabbing transition-shadow";

  return (
    <div onClick={() => onClick?.(issue)} className={cls} style={style}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-fg-subtle">{issue.identifier}</span>
        {issue.assignee && (
          <Avatar name={issue.assignee.name} src={issue.assignee.avatarUrl} size="sm" />
        )}
      </div>

      <p className="mt-1.5 text-sm leading-snug text-fg">{issue.title}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <PIcon className="h-3.5 w-3.5" style={{ color: priority.color }} title={priority.label} />
        {issue.labels?.map((l) => (
          <span
            key={l.id}
            className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[11px] text-fg-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name}
          </span>
        ))}
        {showProject && issue.project && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[11px] text-fg-muted">
            {issue.project.icon ? (
              <span aria-hidden="true">{issue.project.icon}</span>
            ) : (
              <Box className="h-3 w-3" aria-hidden="true" />
            )}
            {issue.project.name}
          </span>
        )}
      </div>
    </div>
  );
}
