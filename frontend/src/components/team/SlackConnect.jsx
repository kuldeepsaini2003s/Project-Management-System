import { useEffect, useState } from "react";
import { Slack, Check } from "lucide-react";
import Button from "../ui/Button.jsx";
import { teamService } from "../../services/teamService.js";

export default function SlackConnect({ teamId, isAdmin }) {
  const [conn, setConn] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    teamService.getSlack(teamId).then(setConn).catch(() => {});
  }, [teamId]);

  const connect = async () => {
    if (!url.trim()) return;
    setError("");
    setLoading(true);
    try {
      const c = await teamService.connectSlack(teamId, url.trim());
      setConn(c);
      setUrl("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect Slack from this team?")) return;
    await teamService.disconnectSlack(teamId).catch(() => {});
    setConn({ connected: false });
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <Slack className="h-5 w-5 text-fg-muted" />
        <h3 className="text-sm font-semibold text-fg">Connect Slack channel</h3>
      </div>
      <p className="mb-3 text-xs text-fg-muted">
        When a teammate is @mentioned in a comment, we post it to your Slack channel.
      </p>

      {error && <p className="mb-2 text-xs text-danger">{error}</p>}

      {conn?.connected ? (
        <div className="flex flex-col gap-2 text-sm">
          <span className="inline-flex items-center gap-2 text-fg">
            <Check className="h-4 w-4 text-success" />
            Slack channel connected
          </span>
          {isAdmin && (
            <button onClick={disconnect} className="self-start text-xs text-danger hover:underline">
              Disconnect
            </button>
          )}
        </div>
      ) : isAdmin ? (
        <div className="flex flex-col gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/…"
            className="h-9 w-full rounded-md border border-input-border bg-input px-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          <p className="text-[11px] text-fg-subtle">
            Slack → your app → Incoming Webhooks → Add to Slack → copy the URL.
          </p>
          <Button className="!w-auto self-start px-3" onClick={connect} isLoading={loading}>
            <Slack className="h-4 w-4" />
            Connect Slack
          </Button>
        </div>
      ) : (
        <p className="text-sm text-fg-subtle">Slack is not connected.</p>
      )}
    </div>
  );
}
