import { useState } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { projectStatuses } from "../../../data/settings/mockStatuses.js";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";

function StatusIcon({ type }) {
  const iconMap = {
    backlog: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    ),
    planned: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    ),
    "in-progress": (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M8 2.5A5.5 5.5 0 0 1 13.5 8" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    completed: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
        <circle cx="8" cy="8" r="6.5" fill="#3b82f6" />
        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    canceled: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#6b7280" strokeWidth="1.5" />
        <path d="M6 6l4 4M10 6l-4 4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };
  return iconMap[type] || null;
}

function StatusGroup({ group }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
      {/* Category header */}
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-surface-hover transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-fg-subtle" />
          )}
          <span className="text-sm font-medium text-fg">{group.category}</span>
        </div>
        <button
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-surface-hover hover:text-fg transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Statuses */}
      {expanded && group.statuses.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-3 border-t border-glass-border px-5 py-3 hover:bg-surface-hover transition-colors"
        >
          <StatusIcon type={group.icon} />
          <span className="flex-1 text-sm font-medium text-fg">{s.name}</span>
          {s.projects > 0 && (
            <span className="text-xs text-fg-muted">{s.projects} {s.projects === 1 ? "project" : "projects"}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProjectStatusesPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader
        title="Project statuses"
        description="Project statuses define the workflow that projects go through from start to completion"
      />

      <div className="flex flex-col gap-3">
        {projectStatuses.map((group) => (
          <StatusGroup key={group.category} group={group} />
        ))}
      </div>
    </div>
  );
}
