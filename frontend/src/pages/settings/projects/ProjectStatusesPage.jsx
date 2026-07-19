import { useState } from "react";
import { Plus } from "lucide-react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";

function StatusIcon({ type }) {
  const icons = {
    backlog: (
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    ),
    planned: (
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    ),
    "in-progress": (
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M8 2.5A5.5 5.5 0 0 1 13.5 8" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    completed: (
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
        <circle cx="8" cy="8" r="6.5" fill="#3b82f6" />
        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    cancelled: (
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#6b7280" strokeWidth="1.5" />
        <path d="M6 6l4 4M10 6l-4 4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };
  return icons[type] ?? null;
}

function AddStatusForm({ type, onSave, onCancel }) {
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-3 border-t border-glass-border bg-surface-hover/60 px-5 py-2.5">
      <StatusIcon type={type} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSave(name.trim());
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Status name…"
        className="h-7 flex-1 rounded border border-input-border bg-input px-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
        autoFocus
      />
      <button
        onClick={() => name.trim() && onSave(name.trim())}
        className="rounded bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand/90 transition-colors"
      >
        Create
      </button>
      <button
        onClick={onCancel}
        className="text-xs text-fg-muted hover:text-fg transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

const INITIAL_GROUPS = [
  { key: "backlog",     label: "Backlog",      icon: "backlog",     items: [{ id: "1", name: "Backlog",      projects: 0 }] },
  { key: "planned",     label: "Planned",      icon: "planned",     items: [{ id: "2", name: "Planned",      projects: 0 }] },
  { key: "in-progress", label: "In Progress",  icon: "in-progress", items: [{ id: "3", name: "In Progress",  projects: 1 }] },
  { key: "completed",   label: "Completed",    icon: "completed",   items: [{ id: "4", name: "Completed",    projects: 5 }] },
  { key: "cancelled",   label: "Cancelled",    icon: "cancelled",   items: [{ id: "5", name: "Cancelled",    projects: 0 }] },
];

function StatusGroup({ group, onAdd }) {
  const [adding, setAdding] = useState(false);

  const handleSave = (name) => {
    onAdd(group.key, name);
    setAdding(false);
  };

  return (
    <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-surface-hover/50">
        <span className="text-sm font-semibold text-fg">{group.label}</span>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center justify-center rounded p-1 text-fg-muted hover:bg-surface hover:text-fg transition-colors"
          title={`Add ${group.label} status`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {group.items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 border-t border-glass-border px-5 py-3 hover:bg-surface-hover transition-colors"
        >
          <StatusIcon type={group.icon} />
          <span className="flex-1 text-sm font-medium text-fg">{item.name}</span>
          {item.projects > 0 && (
            <span className="text-xs text-fg-muted">
              {item.projects} {item.projects === 1 ? "project" : "projects"}
            </span>
          )}
        </div>
      ))}

      {adding && (
        <AddStatusForm
          type={group.icon}
          onSave={handleSave}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}

export default function ProjectStatusesPage() {
  const [groups, setGroups] = useState(INITIAL_GROUPS);

  const handleAdd = (groupKey, name) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.key !== groupKey
          ? g
          : { ...g, items: [...g.items, { id: `${Date.now()}`, name, projects: 0 }] }
      )
    );
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader
        title="Project statuses"
        description="Project statuses define the workflow that projects go through from start to completion"
      />
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <StatusGroup key={group.key} group={group} onAdd={handleAdd} />
        ))}
      </div>
    </div>
  );
}
