import { useParams, useOutletContext } from "react-router-dom";
import { Server } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import { useGetTeamQuery } from "../../redux/apiSlice.js";

export default function MCPServerPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const { data: team } = useGetTeamQuery(teamId);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[
          { label: team?.name || "Team", to: `/teams/${teamId}` },
          { label: "Integrations", to: `/teams/${teamId}/integrations` },
          "MCP Server",
        ]}
        onMenu={onMenu}
      />

      <div className="glass min-h-0 flex-1 overflow-y-auto rounded-lg p-5 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover">
              <Server className="h-5 w-5 text-fg" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-fg">MCP Server</h1>
              <p className="text-xs text-fg-muted">
                Connect Claude, Cursor, ChatGPT and other AI tools to your workspace.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-4">
            <p className="text-xs text-fg-muted">
              A Model Context Protocol server that lets Claude, Cursor, ChatGPT and other tools push
              task-mention messages to your Slack channel. It exposes{" "}
              <code className="rounded bg-surface-hover px-1 py-0.5 text-fg">send_slack_message</code>{" "}
              and{" "}
              <code className="rounded bg-surface-hover px-1 py-0.5 text-fg">notify_task_mention</code>{" "}
              tools.
            </p>

            <div>
              <p className="mb-1.5 text-xs font-medium text-fg">Run locally (Claude Desktop, Cursor)</p>
              <pre className="overflow-x-auto rounded-md bg-surface-hover p-3 text-[11px] text-fg">
{`node mcp-server/index.js`}
              </pre>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-fg">Run as HTTP server (ChatGPT / hosted)</p>
              <pre className="overflow-x-auto rounded-md bg-surface-hover p-3 text-[11px] text-fg">
{`node mcp-server/index.js --http`}
              </pre>
            </div>

            <div className="rounded-lg border border-glass-border p-3">
              <p className="mb-1 text-xs font-medium text-fg">Required environment variable</p>
              <pre className="text-[11px] text-fg-muted">
{`SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...`}
              </pre>
              <p className="mt-1.5 text-[11px] text-fg-subtle">
                Connect Slack first to get your webhook URL, then set it for the MCP server. See{" "}
                <code className="text-fg">mcp-server/README.md</code> for full client config examples.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
