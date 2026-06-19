import { useEffect, useState } from "react";
import { Slack, Check } from "lucide-react";
import Button from "../ui/Button.jsx";
import { teamService } from "../../services/teamService.js";

export default function SlackConnect({ teamId, isAdmin }) {
  const [conn, setConn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => teamService.getSlack(teamId).then(setConn).catch(() => {});

  useEffect(() => {
    refresh();
    // If we just came back from the Slack OAuth redirect, refresh + clean the URL.
    const params = new URLSearchParams(window.location.search);
    if (params.get("slack")) {
      if (params.get("slack") === "error") setError(params.get("message") || "Slack connect failed");
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(refresh, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const connect = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await teamService.slackAuthorizeUrl(teamId);
      if (result.reconnected) {
        // Existing webhook reactivated instantly — no Slack redirect needed.
        await refresh();
        setLoading(false);
        return;
      }
      // Fresh OAuth — redirect to Slack's authorization page.
      window.location.href = result.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect Slack from this team?")) return;
    await teamService.disconnectSlack(teamId).catch(() => {});
    setConn({ connected: false });
  };

  return (
    <div>
      {error && <p className="mb-2 text-xs text-danger">{error}</p>}

      {conn?.connected ? (
        <div className="flex flex-col gap-2 rounded-lg border border-glass-border p-3 text-sm">
          <div className="flex items-center gap-2 text-fg">
            <Check className="h-4 w-4 text-success" />
            Connected{conn.channel ? ` to ${conn.channel}` : ""}
            {conn.slackTeamName ? (
              <span className="text-xs text-fg-muted">({conn.slackTeamName})</span>
            ) : null}
          </div>
          <p className="text-xs text-fg-muted">
            When a teammate is @mentioned in a comment, we post a notification to{" "}
            {conn.channel || "your Slack channel"}.
          </p>
          {isAdmin && (
            <button onClick={disconnect} className="self-start text-xs text-danger hover:underline">
              Disconnect
            </button>
          )}
        </div>
      ) : isAdmin ? (
        <Button className="!w-auto px-3" onClick={connect} isLoading={loading}>
          <Slack className="h-4 w-4" />
          Connect Slack
        </Button>
      ) : (
        <p className="text-sm text-fg-subtle">Slack is not connected.</p>
      )}
    </div>
  );
}
