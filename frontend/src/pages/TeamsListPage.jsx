import { useNavigate, useOutletContext } from "react-router-dom";
import { Box, Check } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { useTeams } from "../context/TeamContext.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";

function TeamGlyph({ team }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white"
      style={{ backgroundColor: team.color || "#5e6ad2" }}
    >
      {team.icon || team.key?.[0] || "T"}
    </span>
  );
}

const th = "whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-fg-subtle";
const td = "whitespace-nowrap px-4 py-2.5";

export default function TeamsListPage() {
  const { onMenu } = useOutletContext() || {};
  const { teams, loading } = useTeams();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar breadcrumb={["Teams"]} onMenu={onMenu} />

      <Skeleton name="teams-list" loading={loading && teams.length === 0}>
      <div className="glass min-h-0 flex-1 overflow-auto rounded-lg p-4 sm:p-5">
        <p className="px-4 pb-2 text-xs text-fg-subtle">
          {teams.length} team{teams.length === 1 ? "" : "s"}
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border">
              <th className={`${th} w-full`}>Name</th>
              <th className={`${th} hidden sm:table-cell`}>Membership</th>
              <th className={`${th} hidden md:table-cell`}>Members</th>
              <th className={`${th} text-right`}>Active projects</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-fg-subtle">
                  No teams yet
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr
                  key={team.id}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="cursor-pointer border-b border-glass-border/60 hover:bg-surface-hover"
                >
                  <td className={`${td} w-full`}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <TeamGlyph team={team} />
                      <span className="truncate font-medium text-fg">{team.name}</span>
                      <span className="shrink-0 text-xs text-fg-subtle">{team.key}</span>
                    </div>
                  </td>
                  <td className={`${td} hidden sm:table-cell`}>
                    {team.role && (
                      <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
                        <Check className="h-3.5 w-3.5 text-success" />
                        Joined
                      </span>
                    )}
                  </td>
                  <td className={`${td} hidden md:table-cell`}>
                    <span className="flex items-center gap-2">
                      <span className="flex -space-x-1.5">
                        {(team.members || []).slice(0, 5).map((u) => (
                          <Avatar key={u.id} name={u.name} src={u.avatarUrl} size="sm" className="ring-1 ring-bg" />
                        ))}
                      </span>
                      <span className="text-xs text-fg-muted">{team.memberCount ?? 0}</span>
                    </span>
                  </td>
                  <td className={`${td} text-right text-fg-muted`}>
                    <span className="inline-flex items-center gap-1.5">
                      <Box className="h-3.5 w-3.5" />
                      {team.activeProjectCount ?? 0}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </Skeleton>
    </div>
  );
}
