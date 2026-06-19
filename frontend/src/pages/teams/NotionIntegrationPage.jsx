import { useParams, useOutletContext } from "react-router-dom";
import { BookText } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import NotionConnect from "../../components/team/NotionConnect.jsx";
import { useGetTeamQuery } from "../../redux/apiSlice.js";

export default function NotionIntegrationPage() {
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
          "Notion",
        ]}
        onMenu={onMenu}
      />

      <div className="glass min-h-0 flex-1 overflow-y-auto rounded-lg p-5 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover">
              <BookText className="h-5 w-5 text-fg" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-fg">Notion</h1>
              <p className="text-xs text-fg-muted">
                Connect your Notion workspace to access pages and databases from this team.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <NotionConnect teamId={teamId} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </div>
  );
}
