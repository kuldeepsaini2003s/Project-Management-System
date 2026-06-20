import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { issueLabels } from "../../../data/settings/mockLabels.js";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import LabelFormModal from "../../../components/settings/LabelFormModal.jsx";

export default function IssueLabelsPage() {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("Workspace");
  const [createOpen, setCreateOpen] = useState(false);
  const [labels, setLabels] = useState(issueLabels);

  const filtered = labels.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <SettingsPageHeader title="Issue labels" />

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name..."
            className="h-8 w-full rounded-md border border-input-border bg-input pl-8 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          onClick={() => setScope(scope === "Workspace" ? "Team" : "Workspace")}
          className="flex h-8 items-center gap-1.5 rounded-md border border-input-border bg-input px-3 text-sm text-fg hover:bg-surface-hover transition-colors"
        >
          {scope}
          <svg className="h-3.5 w-3.5 text-fg-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" className="!w-auto px-3 text-sm flex items-center gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New group
          </Button>
          <Button className="!w-auto px-3 text-sm flex items-center gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New label
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="py-3 pl-5 pr-3 text-left text-xs font-medium text-fg-muted">Name ↓</th>
              <th className="py-3 px-3 text-left text-xs font-medium text-fg-muted">Description</th>
              <th className="py-3 px-3 text-right text-xs font-medium text-fg-muted">Issues</th>
              <th className="py-3 px-3 text-right text-xs font-medium text-fg-muted">Last applied</th>
              <th className="py-3 pl-3 pr-5 text-right text-xs font-medium text-fg-muted">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-fg-muted">
                  No labels found
                </td>
              </tr>
            ) : (
              filtered.map((label) => (
                <tr key={label.id} className="hover:bg-surface-hover transition-colors group">
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="font-medium text-fg">{label.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-fg-muted">{label.description || "—"}</td>
                  <td className="py-3 px-3 text-right text-fg-muted">{label.issues}</td>
                  <td className="py-3 px-3 text-right text-fg-muted">{label.lastApplied}</td>
                  <td className="py-3 pl-3 pr-5 text-right text-fg-muted">{label.created}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LabelFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={(l) => {
        setLabels((prev) => [...prev, { ...l, id: String(Date.now()), issues: 0, lastApplied: "—", created: "Now" }]);
        setCreateOpen(false);
      }} />
    </div>
  );
}
