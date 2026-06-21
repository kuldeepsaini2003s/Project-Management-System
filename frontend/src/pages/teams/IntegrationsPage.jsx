import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ExternalLink, CheckCircle2, AlertCircle, Loader2, Zap, ArrowRight } from "lucide-react";
import {
  useGetTeamQuery,
  useGetTeamGithubQuery,
  useLazyGetTeamGithubAuthorizeQuery,
  useDisconnectTeamGithubMutation,
  useGetTeamSlackQuery,
  useLazyGetTeamSlackAuthorizeQuery,
  useDisconnectTeamSlackMutation,
  useGetTeamNotionQuery,
  useLazyGetTeamNotionAuthorizeQuery,
  useDisconnectTeamNotionMutation,
} from "../../redux/apiSlice.js";

/* ── Icons ───────────────────────────────────────────────────────────────── */
const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
  </svg>
);

const NotionIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

/* ── Single integration card ─────────────────────────────────────────────── */
function IntegrationCard({ icon, name, description, details, teamId, useConn, useAuth, useDisconn, highlight }) {
  const { data: conn, isLoading, refetch } = useConn(teamId, { skip: !teamId });
  const [authorize] = useAuth();
  const [disconnect, { isLoading: disconnecting }] = useDisconn();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connected = !!conn?.connected;

  const subLabel = conn?.slackTeamName
    ? `Connected to ${conn.slackTeamName}${conn.channel ? ` · #${conn.channel}` : ""}`
    : conn?.workspaceName
    ? `Connected to ${conn.workspaceName}`
    : conn?.account
    ? `Connected as ${conn.account}`
    : null;

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const result = await authorize(teamId);
      if (result.error) throw new Error(result.error?.data?.message || "Failed to connect");
      if (result.data?.reconnected) { refetch(); }
      else if (result.data?.url) { window.location.href = result.data.url; }
    } catch (err) {
      setError(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setError("");
    try {
      await disconnect(teamId).unwrap();
      refetch();
    } catch (err) {
      setError(err?.data?.message || "Failed to disconnect");
    }
  };

  return (
    <div
      className={`rounded-xl border bg-surface/40 p-5 transition-colors ${
        highlight ? "border-brand/40 bg-brand/5" : "border-glass-border"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-hover">
          {icon}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-fg">{name}</span>
            {connected && (
              <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-fg-muted">{description}</p>
          {subLabel && <p className="text-xs text-fg-muted/80">{subLabel}</p>}
          {details && !connected && (
            <ul className="mt-1 flex flex-col gap-0.5">
              {details.map((d) => (
                <li key={d} className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <span className="h-1 w-1 rounded-full bg-fg-subtle shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-fg-muted" />
          ) : connected ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-md border border-glass-border bg-surface/60 px-4 py-1.5 text-sm font-medium text-fg-muted hover:border-red-400/50 hover:text-red-400 disabled:opacity-60 transition-colors"
            >
              {disconnecting ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60 transition-colors"
            >
              {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function IntegrationsPage() {
  const { teamId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get("tab"); // "github" | "slack" | "notion" | null

  const { data: team } = useGetTeamQuery(teamId, { skip: !teamId });

  const integrations = [
    {
      key: "github",
      icon: <GitHubIcon />,
      name: "GitHub",
      description: "Sync pull requests and commits with your issues. PRs that reference an issue (e.g. ALG-12) move it to Done automatically.",
      details: [
        "Link a repository to a project when creating it",
        "PRs referencing an issue ID move it to Done",
        "See PR status directly on issues",
      ],
      useConn: useGetTeamGithubQuery,
      useAuth: useLazyGetTeamGithubAuthorizeQuery,
      useDisconn: useDisconnectTeamGithubMutation,
    },
    {
      key: "slack",
      icon: <SlackIcon />,
      name: "Slack",
      description: "Receive notifications in Slack when teammates mention you in a comment or assign you an issue.",
      details: [
        "Get notified when @mentioned in comments",
        "Receive issue assignment alerts",
        "Post updates to Slack channels",
      ],
      useConn: useGetTeamSlackQuery,
      useAuth: useLazyGetTeamSlackAuthorizeQuery,
      useDisconn: useDisconnectTeamSlackMutation,
    },
    {
      key: "notion",
      icon: <NotionIcon />,
      name: "Notion",
      description: "Preview issues, projects, and views within Notion documents.",
      details: [
        "Paste issue links in Notion for rich previews",
        "See issue status and assignee inline",
        "Keep docs and issues in sync",
      ],
      useConn: useGetTeamNotionQuery,
      useAuth: useLazyGetTeamNotionAuthorizeQuery,
      useDisconn: useDisconnectTeamNotionMutation,
    },
  ];

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
          {team?.name || "Team"}
        </p>
        <h1 className="mt-0.5 text-xl font-semibold text-fg">Integrations</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Connect your team's tools. Changes here are instantly reflected in{" "}
          <span className="font-medium text-fg">Settings → Connected accounts</span>.
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {integrations.map((props) => (
          <IntegrationCard
            key={props.key}
            {...props}
            teamId={teamId}
            highlight={activeTab === props.key}
          />
        ))}

        {/* MCP / API card */}
        <div className="rounded-xl border border-brand/25 bg-brand/5 p-5 transition-colors hover:border-brand/40">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <Zap className="h-6 w-6 text-brand" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-fg">MCP Server & API</span>
                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                  New
                </span>
              </div>
              <p className="text-sm text-fg-muted">
                Connect Claude, GPT, or any LLM to this workspace via the Model Context Protocol.
                Create issues, notify Slack, and query your data from any AI agent.
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {["11 tools — list, create, update issues & projects", "Create issue + Slack notify in one tool call", "Use with Claude Desktop, n8n, Zapier, or any HTTP client"].map((d) => (
                  <li key={d} className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <span className="h-1 w-1 rounded-full bg-brand/60 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => navigate(`/teams/${teamId}/integrations/mcp`)}
              className="shrink-0 flex items-center gap-1.5 rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
            >
              Set up
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
