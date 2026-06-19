import { useParams, useOutletContext } from "react-router-dom";
import { Github } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import GitHubConnect from "../../components/team/GitHubConnect.jsx";
import { useGetTeamQuery } from "../../redux/apiSlice.js";

export default function GitHubIntegrationPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const { data: team } = useGetTeamQuery(teamId);
  const isAdmin = team?.role === "OWNER" || team?.role === "ADMIN";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[
          { label: team?.name || "Team", to: `/teams/${teamId}` },
          { label: "Integrations", to: `/teams/${teamId}/integrations` },
          "GitHub",
        ]}
        onMenu={onMenu}
      />

      <div className="glass min-h-0 flex-1 overflow-y-auto rounded-lg p-5 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover">
                <Github className="h-5 w-5 text-fg" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-fg">GitHub</h1>
                <p className="text-xs text-fg-muted">
                  Connect your GitHub App to link repositories and sync pull requests.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-2">
            <GitHubConnect teamId={teamId} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </div>
  );
}
