import { useState } from "react";
import { Plus } from "lucide-react";
import { ISSUE_STATUSES, ISSUE_STATUS_ORDER } from "../../constants/issueStatus.js";
import IssueCard from "./IssueCard.jsx";

export default function IssueBoard({ issues, onCreate, onMoveStatus, onOpen, showProject = true }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const onDragStart = (e, issue) => {
    setDragId(issue.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (status) => {
    if (dragId) onMoveStatus?.(dragId, status);
    setDragId(null);
    setOverCol(null);
  };

  const grouped = (status) => issues.filter((i) => i.status === status);

  return (
    <div className="flex h-full gap-3 overflow-x-auto pb-1">
      {ISSUE_STATUS_ORDER.map((status) => {
        const meta = ISSUE_STATUSES[status];
        const Icon = meta.icon;
        const items = grouped(status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={() => onDrop(status)}
            className={`flex w-72 shrink-0 flex-col rounded-lg transition-colors ${
              overCol === status ? "bg-surface-hover/60" : ""
            }`}
          >
            <div className="flex items-center gap-2 px-2 py-2">
              <Icon className="h-4 w-4" style={{ color: meta.color }} />
              <span className="text-sm font-medium text-fg">{meta.label}</span>
              <span className="text-xs text-fg-subtle">{items.length}</span>
              <button
                onClick={() => onCreate?.(status)}
                className="ml-auto rounded p-1 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
                title="Add issue"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-1 pb-2">
              {items.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onDragStart={onDragStart}
                  onClick={onOpen}
                  showProject={showProject}
                />
              ))}
              {items.length === 0 && (
                <button
                  onClick={() => onCreate?.(status)}
                  className="rounded-lg border border-dashed border-border py-3 text-xs text-fg-subtle transition-colors hover:border-border-strong hover:text-fg-muted"
                >
                  + New issue
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
