import { useState } from "react";
import { UserPlus, Check, X, MoreHorizontal } from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Popover from "../../components/ui/Popover.jsx";
import FormError from "../../components/ui/FormError.jsx";
import {
  useGetTeamRequestsQuery,
  useRemoveTeamMemberMutation,
  useRespondRequestMutation,
  useCreateTeamInvitesMutation,
  errMsg,
} from "../../redux/apiSlice.js";

const ROLE_LABEL = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" };

const handleFromEmail = (email = "") => email.split("@")[0];

export default function TeamMembersPanel({ team, members, isAdmin }) {
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: requests = [] } = useGetTeamRequestsQuery(team.id, {
    skip: !isAdmin,
    pollingInterval: 15000,
  });

  const [respond] = useRespondRequestMutation();
  const [removeMember] = useRemoveTeamMemberMutation();

  const onRespond = async (id, accept) => {
    try {
      await respond({ requestId: id, accept, teamId: team.id }).unwrap();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const onRemove = async (userId) => {
    if (!window.confirm("Remove this member from the team?")) return;
    try {
      await removeMember({ teamId: team.id, userId }).unwrap();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="p-5">
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="mb-4 flex items-center justify-end">
        {isAdmin && (
          <Button variant="secondary" className="!w-auto px-3" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite people
          </Button>
        )}
      </div>

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
                  onClick={() => onRespond(r.id, true)}
                  className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-brand-fg hover:bg-brand-hover"
                >
                  <Check className="h-3.5 w-3.5" /> Accept
                </button>
                <button
                  onClick={() => onRespond(r.id, false)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-fg-muted hover:bg-surface-hover hover:text-fg"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_8rem] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_12rem] gap-4 border-b border-glass-border px-2 pb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
        <span>Name</span>
        <span className="hidden sm:block">Email</span>
        <span className="text-right">Role</span>
      </div>

      {members.map((m) => {
        const removable = isAdmin && m.role !== "OWNER";
        return (
          <div
            key={m.id}
            className="grid grid-cols-[minmax(0,1fr)_8rem] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_12rem] items-center gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-hover"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={m.name} src={m.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm text-fg">{m.name}</p>
                <p className="truncate text-xs text-fg-subtle">{handleFromEmail(m.email)}</p>
              </div>
            </div>
            <span className="hidden truncate text-sm text-fg-muted sm:block">{m.email}</span>
            <div className="flex items-center justify-end gap-3 sm:gap-7">
              <span className="text-sm text-brand">{ROLE_LABEL[m.role] || m.role}</span>
              {removable && (
                <Popover
                  align="right"
                  trigger={({ toggle }) => (
                    <button
                      onClick={toggle}
                      aria-label="Member options"
                      className="rounded-md p-1 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  )}
                >
                  {({ close }) => (
                    <button
                      onClick={() => {
                        close();
                        onRemove(m.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-danger hover:bg-surface-hover"
                    >
                      Remove from team
                    </button>
                  )}
                </Popover>
              )}
            </div>
          </div>
        );
      })}

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        teamId={team.id}
      />
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteModal({ open, onClose, teamId }) {
  const [createInvites, { isLoading }] = useCreateTeamInvitesMutation();
  const [text, setText] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState("");

  const parseEmails = (s) =>
    [...new Set(s.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];

  const send = async () => {
    const emails = parseEmails(text);
    const invalid = emails.filter((e) => !EMAIL_RE.test(e));
    if (emails.length === 0) return setError("Enter at least one email address");
    if (invalid.length) return setError(`Invalid email: ${invalid[0]}`);
    setError("");
    try {
      await createInvites({ teamId, emails, role }).unwrap();
      setText("");
      onClose?.();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={isLoading ? undefined : onClose}
      size="md"
      title="Invite to your workspace"
      footer={
        <Button className="!w-auto px-4" onClick={send} isLoading={isLoading}>
          Send invites
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <FormError message={error} />
        <label className="text-sm font-medium text-fg">Email</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          autoFocus
          placeholder="email@uptodate.com, email2@uptodate.com…"
          className="w-full resize-none rounded-lg border border-input-border bg-input px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
        />
        <div className="mt-1 flex items-center gap-2">
          <label className="text-sm text-fg-muted">Invite as</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 rounded-md border border-input-border bg-input px-2 text-sm text-fg focus:outline-none"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
