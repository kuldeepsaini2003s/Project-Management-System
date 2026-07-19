import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, UserPlus, Download, X } from "lucide-react";
import { useWorkspace } from "../../../context/WorkspaceContext.jsx";
import {
  useGetWorkspaceMembersQuery,
  useGetWorkspaceTeamsQuery,
  useCreateTeamInvitesMutation,
} from "../../../redux/apiSlice.js";
import Avatar from "../../../components/ui/Avatar.jsx";
import { Skeleton } from "../../../components/ui/Skeleton.jsx";

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const diffDays = (Date.now() - d) / 86400000;
  if (diffDays < 60) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function isOnline(dateStr) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 5 * 60 * 1000;
}

function lastSeenLabel(dateStr) {
  if (!dateStr) return { text: "Never", online: false };
  if (Date.now() - new Date(dateStr).getTime() < 5 * 60 * 1000) return { text: "Online", online: true };
  return { text: fmtDate(dateStr), online: false };
}

function exportCSV(members) {
  const headers = ["Name", "Email", "Role", "Teams", "Joined", "Last seen"];
  const rows = members.map((m) => [
    m.name || "",
    m.email || "",
    m.role || "",
    (m.teams || []).map((t) => t.name || t.key).join("; "),
    m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "",
    m.lastSeenAt ? new Date(m.lastSeenAt).toLocaleDateString() : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "members.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function InviteModal({ open, onClose, workspaceId }) {
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const { data: teams = [] } = useGetWorkspaceTeamsQuery(workspaceId, { skip: !workspaceId });
  const [createInvites, { isLoading }] = useCreateTeamInvitesMutation();

  const addEmail = () => {
    const val = emailInput.trim().toLowerCase();
    if (!val) return;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!valid) { setError("Invalid email address"); return; }
    if (emails.includes(val)) { setError("Already added"); return; }
    setEmails((prev) => [...prev, val]);
    setEmailInput("");
    setError("");
  };

  const removeEmail = (e) => setEmails((prev) => prev.filter((x) => x !== e));

  const handleKeyDown = (ev) => {
    if (ev.key === "Enter" || ev.key === ",") { ev.preventDefault(); addEmail(); }
    if (ev.key === "Backspace" && !emailInput && emails.length) {
      setEmails((prev) => prev.slice(0, -1));
    }
  };

  const handleSend = async () => {
    const pending = emailInput.trim().toLowerCase();
    const allEmails = pending ? [...emails, pending] : emails;
    if (!allEmails.length) { setError("Add at least one email"); return; }
    if (!teamId) { setError("Select a team"); return; }
    try {
      await createInvites({ teamId, emails: allEmails, role }).unwrap();
      setSent(true);
    } catch (err) {
      setError(err?.data?.message || "Failed to send invites");
    }
  };

  const handleClose = () => {
    setEmailInput(""); setEmails([]); setTeamId(""); setRole("MEMBER");
    setError(""); setSent(false); onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-glass-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
          <h2 className="text-base font-semibold text-fg">Invite members</h2>
          <button onClick={handleClose} className="rounded p-1 text-fg-muted hover:text-fg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-fg">Invites sent!</p>
            <p className="mt-1 text-xs text-fg-muted">
              Recipients will receive an email with a link to join.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-muted uppercase tracking-wide">Email addresses</label>
              <div
                className="min-h-[80px] w-full rounded-md border border-input-border bg-input p-2 focus-within:ring-1 focus-within:ring-brand cursor-text"
                onClick={() => document.getElementById("invite-email-input")?.focus()}
              >
                <div className="flex flex-wrap gap-1.5">
                  {emails.map((e) => (
                    <span
                      key={e}
                      className="flex items-center gap-1 rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand"
                    >
                      {e}
                      <button onClick={() => removeEmail(e)} className="hover:text-danger transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="invite-email-input"
                    value={emailInput}
                    onChange={(e) => { setEmailInput(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    onBlur={addEmail}
                    placeholder={emails.length === 0 ? "name@company.com, press Enter to add more" : ""}
                    className="min-w-[160px] flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
                  />
                </div>
              </div>
              <p className="text-xs text-fg-muted">Press Enter or comma to add multiple addresses.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-muted uppercase tracking-wide">Team</label>
              <select
                value={teamId}
                onChange={(e) => { setTeamId(e.target.value); setError(""); }}
                className="h-9 w-full rounded-md border border-input-border bg-input px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">Select a team…</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-muted uppercase tracking-wide">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 w-full rounded-md border border-input-border bg-input px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <div className="flex justify-end gap-2 border-t border-glass-border pt-3">
              <button
                onClick={handleClose}
                className="rounded-md border border-glass-border px-4 py-2 text-sm text-fg-muted hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60 transition-colors"
              >
                {isLoading ? "Sending…" : `Send invite${emails.length > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function StatusBadge({ role }) {
  const label = role === "OWNER" ? "Owner" : role === "ADMIN" ? "Admin" : "Member";
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa" }}
    >
      {label}
    </span>
  );
}

function MemberRow({ member }) {
  const { text: lastSeen, online } = lastSeenLabel(member.lastSeenAt);
  const displayName = member.name || member.email;
  const subName = member.username || (member.name ? member.email : null);
  const teamCount = member.teams?.length ?? 0;

  return (
    <tr className="border-t border-glass-border hover:bg-surface-hover/30 transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <Avatar name={member.name || member.email} src={member.avatarUrl} size="md" />
            {online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface bg-green-500" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-fg truncate leading-tight">{displayName}</span>
            {subName && subName !== displayName && (
              <span className="text-xs text-fg-muted truncate leading-tight">{subName}</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-sm text-fg-muted whitespace-nowrap">{member.email}</td>
      <td className="px-5 py-3 whitespace-nowrap"><StatusBadge role={member.role} /></td>
      <td className="px-5 py-3 text-sm text-fg-muted whitespace-nowrap">
        {teamCount > 0 ? `${teamCount} team${teamCount > 1 ? "s" : ""}` : "—"}
      </td>
      <td className="px-5 py-3 text-sm text-fg-muted whitespace-nowrap">{fmtDate(member.joinedAt)}</td>
      <td className="px-5 py-3 whitespace-nowrap">
        {online ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Online
          </span>
        ) : (
          <span className="text-sm text-fg-muted">{lastSeen}</span>
        )}
      </td>
    </tr>
  );
}

function SectionRow({ label, count }) {
  return (
    <tr>
      <td colSpan={6} className="px-5 py-2 text-xs font-semibold text-fg-muted"
        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-fg-subtle" />
          {label} {count}
        </span>
      </td>
    </tr>
  );
}

export default function MembersPage() {
  const { currentId } = useWorkspace();
  const { data: members = [], isLoading } = useGetWorkspaceMembersQuery(currentId, { skip: !currentId });
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q)
    );
  }, [members, search]);

  const { active, inactive } = useMemo(() => ({
    active: filtered.filter((m) => isOnline(m.lastSeenAt)),
    inactive: filtered.filter((m) => !isOnline(m.lastSeenAt)),
  }), [filtered]);

  return (
    <div className="flex h-full flex-col px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-fg">Members</h1>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="h-8 w-64 rounded-md border border-glass-border bg-surface/60 pl-8 pr-3 text-sm text-fg placeholder:text-fg-muted focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>

        <div className="flex-1" />

        <button
          onClick={() => exportCSV(members)}
          className="flex h-8 items-center gap-1.5 rounded-md border border-glass-border bg-surface/60 px-3 text-sm text-fg hover:bg-surface-hover transition-colors"
        >
          <Download className="h-3.5 w-3.5 text-fg-muted" />
          Export CSV
        </button>

        <button
          onClick={() => setInviteOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </button>
      </div>

      {isLoading ? (
        <Skeleton name="members-settings" loading />
      ) : members.length === 0 ? (
        <div className="py-16 text-center text-sm text-fg-muted">No members yet</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-glass-border bg-surface/30">
          <table className="w-full">
            <colgroup>
              <col />
              <col style={{ width: "1px" }} />
              <col style={{ width: "1px" }} />
              <col style={{ width: "1px" }} />
              <col style={{ width: "1px" }} />
              <col style={{ width: "1px" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                {[{ label: "Name", sort: true }, { label: "Email" }, { label: "Status" }, { label: "Teams" }, { label: "Joined" }, { label: "Last seen" }].map(({ label, sort }) => (
                  <th key={label} className="px-5 py-2.5 text-left text-xs font-semibold text-fg-muted whitespace-nowrap">
                    {label}{sort && <span className="ml-1 text-fg-subtle">↓</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-fg-muted">
                    No members match "{search}"
                  </td>
                </tr>
              ) : (
                <>
                  {active.length > 0 && (
                    <>
                      <SectionRow label="Active" count={active.length} />
                      {active.map((m) => <MemberRow key={m.id} member={m} />)}
                    </>
                  )}
                  <SectionRow
                    label={active.length > 0 ? "All members" : "Members"}
                    count={active.length > 0 ? inactive.length : filtered.length}
                  />
                  {(active.length > 0 ? inactive : filtered).map((m) => (
                    <MemberRow key={m.id} member={m} />
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        workspaceId={currentId}
      />
    </div>
  );
}
