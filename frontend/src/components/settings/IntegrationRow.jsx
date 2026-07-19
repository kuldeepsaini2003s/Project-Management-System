import { useState } from "react";
import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

export default function IntegrationRow({ icon, name, description, teamId, useConn, useAuth, useDisconn }) {
  const { data: conn, isLoading: loadingConn, refetch } = useConn(teamId, { skip: !teamId });
  const [authorize] = useAuth();
  const [disconnect, { isLoading: disconnecting }] = useDisconn();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connected = !!conn?.connected;

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
        refetch();
      } else if (result.data?.url) {
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-hover mt-0.5">
        {icon}
      </div>

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
