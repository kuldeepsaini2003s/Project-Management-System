import { useCallback, useEffect, useState } from "react";
import { useParams, useOutletContext, Link } from "react-router-dom";
import { CircleDot, Box, LayoutGrid, Link2, Check } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import FormError from "../../components/ui/FormError.jsx";
import Button from "../../components/ui/Button.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import TeamMembersPanel from "./TeamMembersPanel.jsx";
import { teamService } from "../../services/teamService.js";

function ShareButton({ teamId }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}/join/${teamId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this invite link:", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button variant="secondary" className="!w-auto px-3" onClick={copy}>
      {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Link copied" : "Share / Invite"}
    </Button>
  );
}

export default function TeamPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [desc, setDesc] = useState("");

  const isAdmin = team?.role === "OWNER" || team?.role === "ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const t = await teamService.get(teamId);
      setTeam(t);
      setDesc(t.description || "");
      setMembers(await teamService.listMembers(teamId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveDescription = async () => {
    if (desc === (team.description || "")) return;
    try {
      const updated = await teamService.update(teamId, { description: desc });
      setTeam(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[team?.name || "Team"]}
        onMenu={onMenu}
        actions={team && <ShareButton teamId={teamId} />}
      />

      <div className="glass min-h-0 flex-1 overflow-y-auto rounded-lg">
        <FormError message={error} />
        {loading ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading…</p>
        ) : team ? (
          <div className="flex flex-col">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-glass-border px-5 py-3">
              {["overview", "members"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
                    tab === t ? "bg-surface-hover font-medium text-fg" : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {t}
                  {t === "members" && (
                    <span className="ml-1.5 text-xs text-fg-subtle">{members.length}</span>
                  )}
                </button>
              ))}
            </div>

            {tab === "overview" ? (
              <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[1fr_280px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: (team.color || "#5e6ad2") + "22" }}
                    >
                      {team.icon || team.key?.[0] || "T"}
                    </span>
                    <h1 className="text-2xl font-semibold tracking-tight text-fg">{team.name}</h1>
                  </div>

                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    onBlur={saveDescription}
                    rows={3}
                    placeholder="Add a description…"
                    disabled={!isAdmin}
                    className="mt-4 w-full resize-none bg-transparent text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none"
                  />
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
                      Members
                    </p>
                    <button
                      onClick={() => setTab("members")}
                      className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-surface-hover"
                    >
                      <span className="flex -space-x-1.5">
                        {members.slice(0, 5).map((m) => (
                          <Avatar key={m.id} name={m.name} src={m.avatarUrl} size="md" className="ring-1 ring-bg" />
                        ))}
                      </span>
                      <span className="text-sm text-fg-muted">{members.length}</span>
                    </button>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
                      Go to
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <GoTo to={`/teams/${teamId}/issues`} icon={CircleDot}>Issues</GoTo>
                      <GoTo to={`/teams/${teamId}/projects`} icon={Box}>Projects</GoTo>
                      <GoTo to="/views" icon={LayoutGrid}>Views</GoTo>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <TeamMembersPanel
                team={team}
                members={members}
                isAdmin={isAdmin}
                onMembersChange={setMembers}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GoTo({ to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
