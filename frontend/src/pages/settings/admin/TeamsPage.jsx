import { useState, useMemo } from "react";
import { Search, Pencil, Trash2 } from "lucide-react";
import { useWorkspace } from "../../../context/WorkspaceContext.jsx";
import {
  useGetWorkspaceTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} from "../../../redux/apiSlice.js";
import Button from "../../../components/ui/Button.jsx";
import Modal from "../../../components/ui/Modal.jsx";

/* ── Date helper ─────────────────────────────────────────────────────────── */
function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/* ── Team icon — colored square matching Linear style ────────────────────── */
function TeamIcon({ name, color }) {
  const bg = color || "#5e6ad2";
  const initials = name?.slice(0, 2).toUpperCase() || "T";
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
      style={{ backgroundColor: bg }}
    >
      {initials[0]}
    </span>
  );
}

/* ── Create team modal ───────────────────────────────────────────────────── */
function CreateTeamModal({ open, onClose, workspaceId }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [createTeam, { isLoading }] = useCreateTeamMutation();

  const handleSave = async () => {
    if (!name.trim()) { setError("Team name is required"); return; }
    try {
      await createTeam({ workspaceId, name: name.trim() }).unwrap();
      setName(""); setError(""); onClose();
    } catch (err) {
      setError(err?.data?.message || "Failed to create team");
    }
  };
  const handleClose = () => { setName(""); setError(""); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create team"
      footer={
        <>
          <Button variant="secondary" className="!w-auto px-4" onClick={handleClose}>Cancel</Button>
          <Button className="!w-auto px-4" onClick={handleSave} isLoading={isLoading}>Create team</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-fg-muted">Teams help organize members and their work around a common focus area.</p>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg">Team name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. Engineering"
            className="h-9 w-full rounded-md border border-input-border bg-input px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
            autoFocus
          />
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}

/* ── Rename team modal ───────────────────────────────────────────────────── */
function RenameTeamModal({ open, onClose, team, workspaceId }) {
  const [name, setName] = useState(team?.name || "");
  const [error, setError] = useState("");
  const [updateTeam, { isLoading }] = useUpdateTeamMutation();

  const handleSave = async () => {
    if (!name.trim()) { setError("Team name is required"); return; }
    if (name.trim() === team?.name) { onClose(); return; }
    try {
      await updateTeam({ id: team.id, workspaceId, name: name.trim() }).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Failed to rename team");
    }
  };
  const handleClose = () => { setName(team?.name || ""); setError(""); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Rename team"
      footer={
        <>
          <Button variant="secondary" className="!w-auto px-4" onClick={handleClose}>Cancel</Button>
          <Button className="!w-auto px-4" onClick={handleSave} isLoading={isLoading}>Rename</Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-fg">Team name</label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="h-9 w-full rounded-md border border-input-border bg-input px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
          autoFocus
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Modal>
  );
}

/* ── Single team row ─────────────────────────────────────────────────────── */
function TeamRow({ team, workspaceId }) {
  const [renaming, setRenaming] = useState(false);
  const [deleteTeam, { isLoading: deleting }] = useDeleteTeamMutation();

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${team.name}"? This cannot be undone.`)) return;
    deleteTeam({ id: team.id, workspaceId });
  };

  return (
    <>
      <tr className="border-t border-glass-border hover:bg-surface-hover/30 transition-colors">
        {/* Name */}
        <td className="px-5 py-2.5">
          <div className="flex items-center gap-2.5">
            <TeamIcon name={team.name} color={team.color} />
            <span className="text-sm font-medium text-fg">{team.name}</span>
            <span className="text-xs text-fg-muted font-medium">{team.key}</span>
          </div>
        </td>

        {/* Visibility */}
        <td className="px-5 py-2.5 text-sm text-fg-muted whitespace-nowrap">
          Workspace
        </td>

        {/* Members */}
        <td className="px-5 py-2.5 text-sm text-fg-muted whitespace-nowrap">
          {team.memberCount ?? 0}
        </td>

        {/* Issues */}
        <td className="px-5 py-2.5 text-sm text-fg-muted whitespace-nowrap">
          {team.issueCount ?? 0}
        </td>

        {/* Created */}
        <td className="px-5 py-2.5 text-sm text-fg-muted whitespace-nowrap">
          <div className="flex items-center justify-between gap-4">
            <span>{fmtDate(team.createdAt)}</span>
            {/* Row actions — appear on hover */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setRenaming(true)}
                className="rounded p-1 text-fg-muted hover:bg-surface hover:text-fg transition-colors"
                title="Rename"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded p-1 text-fg-muted hover:bg-surface hover:text-danger transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </td>
      </tr>

      <RenameTeamModal
        open={renaming}
        onClose={() => setRenaming(false)}
        team={team}
        workspaceId={workspaceId}
      />
    </>
  );
}

/* ── Section header row ──────────────────────────────────────────────────── */
function SectionRow({ label, count }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="px-5 py-2 text-xs font-semibold text-fg-muted"
        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
      >
        {label} {count}
      </td>
    </tr>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function TeamsPage() {
  const { currentId } = useWorkspace();
  const { data: teams = [], isLoading } = useGetWorkspaceTeamsQuery(currentId, { skip: !currentId });
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(
      (t) => t.name?.toLowerCase().includes(q) || t.key?.toLowerCase().includes(q)
    );
  }, [teams, search]);

  return (
    <div className="flex h-full flex-col px-6 py-6">
      {/* ── Title ── */}
      <h1 className="mb-4 text-xl font-semibold text-fg">Teams</h1>

      {/* ── Toolbar ── */}
      <div className="mb-4 flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name..."
            className="h-8 w-56 rounded-md border border-glass-border bg-surface/60 pl-8 pr-3 text-sm text-fg placeholder:text-fg-muted focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>

<div className="flex-1" />

        {/* Create team */}
        <button
          onClick={() => setCreateOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
        >
          Create team
        </button>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-fg-muted">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-glass-border bg-surface/20">
          <table className="w-full">
            <colgroup>
              <col /> {/* Name — expands */}
              <col style={{ width: "1px" }} />
              <col style={{ width: "1px" }} />
              <col style={{ width: "1px" }} />
              <col style={{ width: "1px" }} />
            </colgroup>

            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-fg-muted whitespace-nowrap">
                  Name <span className="text-fg-subtle">↓</span>
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-fg-muted whitespace-nowrap">Visibility</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-fg-muted whitespace-nowrap">Members</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-fg-muted whitespace-nowrap">Issues</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-fg-muted whitespace-nowrap">Created</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-fg-muted">
                    {search ? `No teams match "${search}"` : "No teams yet"}
                  </td>
                </tr>
              ) : (
                <>
                  <SectionRow label="Active" count={filtered.length} />
                  {filtered.map((team) => (
                    <TeamRow key={team.id} team={team} workspaceId={currentId} />
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreateTeamModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaceId={currentId}
      />
    </div>
  );
}
