import { PRIORITIES } from "../../constants/priority.js";
import Avatar from "../ui/Avatar.jsx";

export default function IssueCard({ issue, onClick, onDragStart, showProject = true }) {
  const priority = PRIORITIES[issue.priority] || PRIORITIES.NONE;
  const PIcon = priority.icon;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, issue)}
      onClick={() => onClick?.(issue)}
      className="glass group cursor-pointer rounded-lg p-3 transition-colors hover:bg-surface-hover"
    >
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
            <span>{issue.project.icon || "📦"}</span>
            {issue.project.name}
          </span>
        )}
      </div>
    </div>
  );
}
