import { useState } from "react";
import { Search, Download, UserPlus, MoreHorizontal } from "lucide-react";
import { workspaceMembers } from "../../../data/settings/mockMembers.js";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import Avatar from "../../../components/ui/Avatar.jsx";
import Button from "../../../components/ui/Button.jsx";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = workspaceMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <SettingsPageHeader title="Members" />

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="h-8 w-full rounded-md border border-input-border bg-input pl-8 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          className="flex h-8 items-center gap-1.5 rounded-md border border-input-border bg-input px-3 text-sm text-fg hover:bg-surface-hover transition-colors"
        >
          {filter}
          <svg className="h-3.5 w-3.5 text-fg-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4 4 4-4" /></svg>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" className="!w-auto px-3 text-sm flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button className="!w-auto px-3 text-sm flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border bg-surface/60">
              <th className="py-3 pl-5 pr-3 text-left text-xs font-medium text-fg-muted">Name ↓</th>
              <th className="py-3 px-3 text-left text-xs font-medium text-fg-muted">Email</th>
              <th className="py-3 px-3 text-left text-xs font-medium text-fg-muted">Status</th>
              <th className="py-3 px-3 text-right text-xs font-medium text-fg-muted">Teams</th>
              <th className="py-3 px-3 text-right text-xs font-medium text-fg-muted">Joined</th>
              <th className="py-3 pl-3 pr-5 text-right text-xs font-medium text-fg-muted">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border">
            {/* Active group header */}
            <tr className="bg-surface/30">
              <td colSpan={6} className="px-5 py-2 text-xs font-medium text-fg-muted">
                Active {filtered.length}
              </td>
            </tr>

            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-fg-muted">No members found</td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr key={member.id} className="hover:bg-surface-hover transition-colors group">
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={member.name} size="sm" />
                      <div>
                        <p className="font-medium text-fg leading-tight">{member.name}</p>
                        <p className="text-xs text-fg-muted">{member.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-fg-muted">{member.email}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-fg-muted">
                    {member.teams} team
                  </td>
                  <td className="py-3 px-3 text-right text-fg-muted">{member.joined}</td>
                  <td className="py-3 pl-3 pr-5 text-right">
                    {member.status === "online" ? (
                      <span className="flex items-center justify-end gap-1 text-success text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        Online
                      </span>
                    ) : (
                      <span className="text-xs text-fg-muted">{member.lastSeen}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
