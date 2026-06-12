import { useCallback, useEffect, useState } from "react";
import { UserPlus, Check, X } from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import Popover from "../../components/ui/Popover.jsx";
import usePolling from "../../hooks/usePolling.js";
import { teamService } from "../../services/teamService.js";
import { workspaceService } from "../../services/workspaceService.js";

const ROLE_LABEL = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" };

export default function TeamMembersPanel({ team, members, isAdmin, onMembersChange }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  // Refresh pending requests (admins) and the member list. Runs on mount
  // and on an interval so changes from other people appear without a reload.
  const refresh = useCallback(async () => {
    if (isAdmin) {
      try {
        setRequests(await teamService.listRequests(team.id));
      } catch {
        /* ignore */
      }
    }
    try {
      onMembersChange(await teamService.listMembers(team.id));
    } catch {
      /* ignore */
    }
  }, [isAdmin, team.id, onMembersChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  usePolling(refresh, 7000);

  const respond = async (id, accept) => {
    try {
      await teamService.respondRequest(id, accept);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (accept) onMembersChange(await teamService.listMembers(team.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const addMember = async (userId) => {
    try {
      onMembersChange(await teamService.addMember(team.id, userId));
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm("Remove this member from the team?")) return;
    try {
      onMembersChange(await teamService.removeMember(team.id, userId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-5">
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Team members</h2>
        {isAdmin && (
          <AddMemberButton team={team} members={members} onAdd={addMember} />
        )}
      </div>

      {/* Pending requests */}
      {isAdmin && requests.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
            Pending requests
          </p>
          <div className="flex flex-col gap-1">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-glass-border px-3 py-2"
              >
                <Avatar name={r.user.name} src={r.user.avatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-fg">{r.user.name}</p>
                  <p className="truncate text-xs text-fg-subtle">{r.user.email}</p>
                </div>
                <button
                  onClick={() => respond(r.id, true)}
                  className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-brand-fg hover:bg-brand-hover"
                >
                  <Check className="h-3.5 w-3.5" /> Accept
                </button>
                <button
                  onClick={() => respond(r.id, false)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-fg-muted hover:bg-surface-hover hover:text-fg"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="overflow-hidden rounded-lg border border-glass-border">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-glass-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
          <span>Name</span>
          <span className="hidden sm:block">Email</span>
          <span>Role</span>
        </div>
        {members.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b border-glass-border px-4 py-3 last:border-0"
          >
            <div className="flex items-center gap-2.5">
              <Avatar name={m.name} src={m.avatarUrl} size="lg" />
              <span className="truncate text-sm text-fg">{m.name}</span>
            </div>
            <span className="hidden truncate text-sm text-fg-muted sm:block">{m.email}</span>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
                {ROLE_LABEL[m.role] || m.role}
              </span>
              {isAdmin && m.role !== "OWNER" && (
                <button
                  onClick={() => removeMember(m.id)}
                  className="text-xs text-fg-subtle hover:text-danger"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddMemberButton({ team, members, onAdd }) {
  const [candidates, setCandidates] = useState([]);

  const open = async () => {
    try {
      const ws = await workspaceService.members(team.workspaceId);
      const ids = new Set(members.map((m) => m.id));
      setCandidates(ws.filter((u) => !ids.has(u.id)));
    } catch {
      setCandidates([]);
    }
  };

  return (
    <Popover
      align="right"
      trigger={({ toggle }) => (
        <Button
          variant="secondary"
          className="!w-auto px-3"
          onClick={() => {
            open();
            toggle();
          }}
        >
          <UserPlus className="h-4 w-4" />
          Add a member
        </Button>
      )}
    >
      {({ close }) => (
        <div className="max-h-64 w-60 overflow-y-auto">
          {candidates.length === 0 ? (
            <p className="px-2 py-2 text-xs text-fg-subtle">
              Everyone in the workspace is already on this team. Share the invite link to add others.
            </p>
          ) : (
            candidates.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onAdd(u.id);
                  close();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-hover"
              >
                <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                <span className="truncate">{u.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </Popover>
  );
}
