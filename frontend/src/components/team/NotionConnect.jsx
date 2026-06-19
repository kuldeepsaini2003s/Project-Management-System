import { useEffect, useState } from "react";
import { BookText, Check } from "lucide-react";
import Button from "../ui/Button.jsx";
import { teamService } from "../../services/teamService.js";

export default function NotionConnect({ teamId, isAdmin }) {
  const [conn, setConn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => teamService.getNotion(teamId).then(setConn).catch(() => {});

  useEffect(() => {
    refresh();
    // If we just came back from the Notion OAuth redirect, refresh + clean the URL.
    const params = new URLSearchParams(window.location.search);
    if (params.get("notion")) {
      if (params.get("notion") === "error") setError(params.get("message") || "Notion connect failed");
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(refresh, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const connect = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await teamService.notionAuthorizeUrl(teamId);
      if (result.reconnected) {
        // Existing token reactivated instantly — no Notion redirect needed.
        await refresh();
        setLoading(false);
        return;
      }
      // Fresh OAuth — redirect to Notion's authorization page.
      window.location.href = result.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect Notion from this team?")) return;
    await teamService.disconnectNotion(teamId).catch(() => {});
    setConn({ connected: false });
  };

  return (
    <div>
      {error && <p className="mb-2 text-xs text-danger">{error}</p>}

      {conn?.connected ? (
        <div className="flex flex-col gap-2 rounded-lg border border-glass-border p-3 text-sm">
          <div className="flex items-center gap-2 text-fg">
            {conn.workspaceIcon ? (
              <img src={conn.workspaceIcon} alt="" className="h-4 w-4 rounded" />
            ) : (
              <Check className="h-4 w-4 text-success" />
            )}
            Connected{conn.workspaceName ? ` to ${conn.workspaceName}` : ""}
          </div>
          <p className="text-xs text-fg-muted">
            Your Notion workspace is connected. Pages and databases are accessible to this team.
          </p>
          {isAdmin && (
            <button onClick={disconnect} className="self-start text-xs text-danger hover:underline">
              Disconnect
            </button>
          )}
        </div>
      ) : isAdmin ? (
        <Button className="!w-auto px-3" onClick={connect} isLoading={loading}>
          <BookText className="h-4 w-4" />
          Connect Notion
        </Button>
      ) : (
        <p className="text-sm text-fg-subtle">Notion is not connected.</p>
      )}
    </div>
  );
}
