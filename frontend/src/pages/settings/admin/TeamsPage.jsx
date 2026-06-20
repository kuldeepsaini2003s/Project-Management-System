import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { workspaceTeams } from "../../../data/settings/mockTeams.js";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";

const STATUS_FILTERS = ["Active", "Archived"];

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Active");

  const filtered = workspaceTeams.filter(
    (t) =>
      t.status === filter.toLowerCase() &&
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <SettingsPageHeader title="Teams" />

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
        <div className="flex items-center rounded-md border border-input-border bg-input overflow-hidden">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-3 text-sm transition-colors ${filter === f ? "bg-surface-hover text-fg" : "text-fg-muted hover:text-fg"}`}
            >
              {f}
            </button>
          ))}
          <span className="px-1 text-fg-subtle">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4 4 4-4" /></svg>
          </span>
        </div>
        <div className="ml-auto">
          <Button className="!w-auto px-3 text-sm flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Create team
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border bg-surface/60">
              <th className="py-3 pl-5 pr-3 text-left text-xs font-medium text-fg-muted">Name ↓</th>
              <th className="py-3 px-3 text-right text-xs font-medium text-fg-muted">Visibility</th>
              <th className="py-3 px-3 text-right text-xs font-medium text-fg-muted">Members</th>
              <th className="py-3 px-3 text-right text-xs font-medium text-fg-muted">Issues</th>
              <th className="py-3 pl-3 pr-5 text-right text-xs font-medium text-fg-muted">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border">
            {/* Group header */}
            <tr className="bg-surface/30">
              <td colSpan={5} className="px-5 py-2 text-xs font-medium text-fg-muted capitalize">
                {filter} ↑
              </td>
            </tr>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-fg-muted">No teams found</td>
              </tr>
            ) : (
              filtered.map((team) => (
                <tr key={team.id} className="hover:bg-surface-hover transition-colors">
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.identifier[0]}
                      </div>
                      <span className="font-medium text-fg">{team.name}</span>
                      <span className="text-xs text-fg-muted">{team.identifier}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-fg-muted">{team.visibility}</td>
                  <td className="py-3 px-3 text-right text-fg-muted">{team.members}</td>
                  <td className="py-3 px-3 text-right text-fg-muted">{team.issues}</td>
                  <td className="py-3 pl-3 pr-5 text-right text-fg-muted">{team.created}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
