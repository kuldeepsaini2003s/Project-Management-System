import { useParams, useOutletContext } from "react-router-dom";
import { Slack, Server } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import SlackConnect from "../../components/team/SlackConnect.jsx";
import { useGetTeamQuery } from "../../redux/apiSlice.js";

export default function SlackIntegrationPage() {
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
          "Slack",
        ]}
        onMenu={onMenu}
      />

      <div className="glass min-h-0 flex-1 overflow-y-auto rounded-lg p-5 sm:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover">
              <Slack className="h-5 w-5 text-fg" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-fg">Slack</h1>
              <p className="text-xs text-fg-muted">
                Get notified in Slack when teammates are @mentioned in comments.
              </p>
            </div>
          </div>

          <SlackConnect teamId={teamId} isAdmin={isAdmin} />

          <div className="glass-card rounded-xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Server className="h-5 w-5 text-fg-muted" />
              <h3 className="text-sm font-semibold text-fg">MCP Server</h3>
            </div>
            <p className="mb-2 text-xs text-fg-muted">
              A Model Context Protocol server that lets Claude, Cursor, ChatGPT and other tools push
              task-mention messages to your Slack channel. It exposes{" "}
              <code className="text-fg">send_slack_message</code> and{" "}
              <code className="text-fg">notify_task_mention</code> tools.
            </p>
            <p className="mb-2 text-xs text-fg-subtle">
              Run it from the <code className="text-fg">mcp-server/</code> folder:
            </p>
            <pre className="overflow-x-auto rounded-md bg-surface-hover p-3 text-[11px] text-fg">
{`# local (Claude Desktop, Cursor)
node mcp-server/index.js

# remote (ChatGPT / hosted)
node mcp-server/index.js --http`}
            </pre>
            <p className="mt-2 text-[11px] text-fg-subtle">
              Set <code className="text-fg">SLACK_WEBHOOK_URL</code> for the MCP server, then add it
              to your client config (see <code className="text-fg">mcp-server/README.md</code>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
