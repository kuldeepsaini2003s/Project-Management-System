import { useEffect, useState } from "react";
import { Github, Check } from "lucide-react";
import Button from "../ui/Button.jsx";
import { teamService } from "../../services/teamService.js";

export default function GitHubConnect({ teamId, isAdmin }) {
  const [conn, setConn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => teamService.getGithub(teamId).then(setConn).catch(() => {});

  useEffect(() => {
    refresh();
    // If we just came back from the GitHub OAuth redirect, refresh + clean the URL.
    const params = new URLSearchParams(window.location.search);
    if (params.get("github")) {
      if (params.get("github") === "error") setError(params.get("message") || "GitHub connect failed");
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(refresh, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const connect = async (force = false) => {
    setError("");
    setLoading(true);
    try {
      const { url } = await teamService.githubAuthorizeUrl(teamId, force);
      window.location.href = url; // GitHub's install/authorize screen (account chooser when forced)
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const manage = async () => {
    setError("");
    try {
      const { url } = await teamService.githubManageUrl(teamId);
      window.location.href = url; // GitHub's native "configure repositories" page
    } catch (e) {
      setError(e.message);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect GitHub from this team?")) return;
    await teamService.disconnectGithub(teamId).catch(() => {});
    setConn({ connected: false });
  };

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-subtle">
        <Github className="h-3.5 w-3.5" />
        GitHub
      </p>

      {error && <p className="mb-2 text-xs text-danger">{error}</p>}

      {conn?.connected ? (
        <div className="flex flex-col gap-2 rounded-lg border border-glass-border p-3 text-sm">
          <div className="flex items-center gap-2 text-fg">
            <Check className="h-4 w-4 text-success" />
            Installed{conn.account ? ` on ${conn.account}` : ""}
          </div>
          <p className="text-xs text-fg-muted">
            Link a repository to a project when creating it. PRs that reference an issue id (e.g.{" "}
            <code className="text-fg">ALG-12</code>) move it to Done automatically.
          </p>
          {isAdmin && (
            <button onClick={manage} className="self-start text-xs text-brand hover:underline">
              Configure repositories
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => connect(true)}
              className="self-start text-xs text-brand hover:underline"
            >
              Use a different account
            </button>
          )}
          {isAdmin && (
            <button onClick={disconnect} className="self-start text-xs text-danger hover:underline">
              Disconnect
            </button>
          )}
        </div>
      ) : isAdmin ? (
        <div className="flex flex-col items-start gap-1.5">
          <Button className="!w-auto px-3" onClick={() => connect(false)} isLoading={loading}>
            <Github className="h-4 w-4" />
            Connect GitHub
          </Button>
          <button onClick={() => connect(true)} className="text-xs text-fg-muted hover:underline">
            Use a different account
          </button>
        </div>
      ) : (
        <p className="text-sm text-fg-subtle">GitHub is not connected.</p>
      )}
    </div>
  );
}
