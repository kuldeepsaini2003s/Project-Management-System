import { Link } from "react-router-dom";
import ProjectStatusBadge from "./ProjectStatusBadge.jsx";
import Avatar from "../ui/Avatar.jsx";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="glass group flex flex-col gap-3 rounded-lg p-4 transition-colors hover:bg-surface-hover"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg"
          style={{ backgroundColor: (project.color || "#5e6ad2") + "22" }}
        >
          {project.icon || "📦"}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-fg">{project.name}</h3>
          {project.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <ProjectStatusBadge status={project.status} />
        <div className="flex items-center gap-2">
          {project.targetDate && (
            <span className="text-xs text-fg-subtle">{formatDate(project.targetDate)}</span>
          )}
          {project.lead && (
            <Avatar name={project.lead.name} src={project.lead.avatarUrl} size="sm" />
          )}
        </div>
      </div>
    </Link>
  );
}
