import { useParams, useOutletContext } from "react-router-dom";
import { BookText } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import { useGetTeamQuery } from "../../redux/apiSlice.js";

export default function NotionIntegrationPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const { data: team } = useGetTeamQuery(teamId);

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
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover">
                <BookText className="h-5 w-5 text-fg" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-fg">Notion</h1>
                <p className="text-xs text-fg-muted">
                  Sync issues and projects with your Notion workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover">
                <BookText className="h-6 w-6 text-fg-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-fg">Notion integration coming soon</p>
                <p className="mt-1 text-xs text-fg-muted">
                  We're working on it. You'll be able to sync issues and projects with Notion pages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
