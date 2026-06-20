import { useState } from "react";
import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import { useWorkspace } from "../../../context/WorkspaceContext.jsx";
import {
  useGetWorkspaceTeamsQuery,
  useGetTeamGithubQuery,
  useLazyGetTeamGithubAuthorizeQuery,
  useDisconnectTeamGithubMutation,
  useGetTeamSlackQuery,
  useLazyGetTeamSlackAuthorizeQuery,
  useDisconnectTeamSlackMutation,
  useGetTeamNotionQuery,
  useLazyGetTeamNotionAuthorizeQuery,
  useDisconnectTeamNotionMutation,
} from "../../../redux/apiSlice.js";

/* ── App icons (inline SVG) ──────────────────────────────────────────────── */
const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
  </svg>
);

const NotionIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

/* ── Single integration row ──────────────────────────────────────────────── */
function IntegrationRow({ icon, name, description, teamId, useConn, useAuth, useDisconn }) {
  const { data: conn, isLoading: loadingConn, refetch } = useConn(teamId, { skip: !teamId });
  const [authorize] = useAuth();
  const [disconnect, { isLoading: disconnecting }] = useDisconn();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connected = !!conn?.connected;

  // Build a human-readable sub-label for the connected state
  const subLabel = conn?.slackTeamName
    ? `Workspace: ${conn.slackTeamName}${conn.channel ? ` • #${conn.channel}` : ""}`
    : conn?.workspaceName
    ? `Workspace: ${conn.workspaceName}`
    : conn?.account
    ? `Account: ${conn.account}`
    : null;

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const result = await authorize(teamId);
      if (result.error) {
        throw new Error(result.error?.data?.message || "Connection failed");
      }
      if (result.data?.reconnected) {
        // Instant reconnect — just refresh status
        refetch();
      } else if (result.data?.url) {
        // Redirect to OAuth provider
        window.location.href = result.data.url;
      }
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
    <div className="flex items-start gap-4 border-b border-glass-border px-5 py-4 last:border-0 hover:bg-surface-hover/20 transition-colors">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-hover mt-0.5">
        {icon}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-fg">{name}</span>
          {connected && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </span>
          )}
        </div>
        <span className="text-xs text-fg-muted">{description}</span>
        {subLabel && <span className="mt-0.5 text-xs text-fg-muted/80">{subLabel}</span>}
        {error && (
          <span className="mt-1 flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            {error}
          </span>
        )}
      </div>

      {/* Action button */}
      {!teamId ? null : loadingConn ? (
        <Loader2 className="h-4 w-4 animate-spin text-fg-muted mt-3 shrink-0" />
      ) : connected ? (
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-glass-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-fg-muted hover:border-red-400/50 hover:text-red-400 disabled:opacity-60 transition-colors"
        >
          {disconnecting && <Loader2 className="h-3 w-3 animate-spin" />}
          Disconnect
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={connecting || !teamId}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-glass-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-hover disabled:opacity-60 transition-colors"
        >
          {connecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ExternalLink className="h-3 w-3" />
          )}
          Connect
        </button>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function AccountsPage() {
  const { currentId } = useWorkspace();
  const { data: teams = [], isLoading: teamsLoading } = useGetWorkspaceTeamsQuery(currentId, { skip: !currentId });
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const teamId = selectedTeamId || teams[0]?.id || "";

  const integrations = [
    {
      key: "slack",
      icon: <SlackIcon />,
      name: "Slack",
      description: "Receive notifications and sync message attribution in Slack.",
      useConn: useGetTeamSlackQuery,
      useAuth: useLazyGetTeamSlackAuthorizeQuery,
      useDisconn: useDisconnectTeamSlackMutation,
    },
    {
      key: "notion",
      icon: <NotionIcon />,
      name: "Notion",
      description: "Preview issues, projects, and views within Notion.",
      useConn: useGetTeamNotionQuery,
      useAuth: useLazyGetTeamNotionAuthorizeQuery,
      useDisconn: useDisconnectTeamNotionMutation,
    },
    {
      key: "github",
      icon: <GitHubIcon />,
      name: "GitHub",
      description: "Sync attribution of commits, pull requests, and comments.",
      useConn: useGetTeamGithubQuery,
      useAuth: useLazyGetTeamGithubAuthorizeQuery,
      useDisconn: useDisconnectTeamGithubMutation,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader
        title="Connected accounts"
        description="Connect your team's accounts to sync actions between apps."
      />

      {/* Team picker — only shown when user is in multiple teams */}
      {teams.length > 1 && (
        <div className="mb-5 flex items-center gap-3">
          <span className="shrink-0 text-sm text-fg-muted">Team</span>
          <select
            value={teamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="h-8 rounded-md border border-glass-border bg-surface/60 px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {teamsLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-glass-border bg-surface/40 px-5 py-8 text-center text-sm text-fg-muted">
          Create a team first to connect integrations.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-glass-border bg-surface/40">
          {integrations.map((props) => (
            <IntegrationRow key={props.key} {...props} teamId={teamId} />
          ))}
        </div>
      )}
    </div>
  );
}
