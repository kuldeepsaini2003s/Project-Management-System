import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Settings2,
  Lock,
  Unlock,
  Star,
  GitFork,
  CircleDot,
  GitBranch,
  RefreshCw,
} from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import {
  useGetTeamGithubQuery,
  useLazyGetTeamGithubAuthorizeQuery,
  useGetTeamGithubReposQuery,
  useDisconnectTeamGithubMutation,
} from "../../redux/apiSlice.js";
import { connectOAuthPopup } from "../../utils/oauthPopup.js";

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Java: "#b07219", "C#": "#178600",
  "C++": "#f34b7d", Ruby: "#701516", PHP: "#4F5D95", Swift: "#F05138",
  Kotlin: "#A97BFF", Dart: "#00B4AB", HTML: "#e34c26", CSS: "#563d7c",
  Shell: "#89e051", Vue: "#41b883", Svelte: "#ff3e00",
};

const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
};

function RepoCard({ repo }) {
  const langColor = LANG_COLORS[repo.language] || "#8b8b8b";
  return (
    <a
      href={repo.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-glass-border bg-surface/40 p-4 hover:bg-surface/70 hover:border-glass-border/80 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {repo.private ? (
            <Lock className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
          ) : (
            <Unlock className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
          )}
          <span className="truncate text-sm font-semibold text-brand group-hover:underline">
            {repo.fullName}
          </span>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
          repo.private
            ? "border-yellow-500/30 text-yellow-400"
            : "border-green-500/30 text-green-400"
        }`}>
          {repo.private ? "Private" : "Public"}
        </span>
      </div>

      {repo.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">
          {repo.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-fg-subtle">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: langColor }} />
            {repo.language}
          </span>
        )}
        {repo.stars > 0 && (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {repo.stars.toLocaleString()}
          </span>
        )}
        {repo.forks > 0 && (
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {repo.forks.toLocaleString()}
          </span>
        )}
        {repo.openIssues > 0 && (
          <span className="flex items-center gap-1">
            <CircleDot className="h-3 w-3" />
            {repo.openIssues}
          </span>
        )}
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          {repo.defaultBranch}
        </span>
        {repo.updatedAt && (
          <span className="ml-auto flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            {timeAgo(repo.updatedAt)}
          </span>
        )}
      </div>
    </a>
  );
}

export default function GitHubIntegrationPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const {
    data: conn,
    isLoading,
    refetch,
  } = useGetTeamGithubQuery(teamId, { skip: !teamId });
  const [authorize] = useLazyGetTeamGithubAuthorizeQuery();
  const [disconnect, { isLoading: disconnecting }] =
    useDisconnectTeamGithubMutation();
  const {
    data: repos,
    isLoading: reposLoading,
  } = useGetTeamGithubReposQuery(teamId, { skip: !teamId || !conn?.connected });

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connected = !!conn?.connected;

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const outcome = await connectOAuthPopup({
        provider: "github",
        fetchAuthorize: async () => {
          const result = await authorize(teamId);
          if (result.error)
            throw new Error(result.error?.data?.message || "Failed to connect");
          return result.data;
        },
      });
      if (outcome.status === "connected" || outcome.status === "reconnected") refetch();
      else if (outcome.status === "error") setError(outcome.message || "Connection failed");
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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar breadcrumb={["GitHub"]} onMenu={onMenu} />

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="mb-5 flex gap-4">
            <div className="flex h-fit w-fit shrink-0 items-center rounded-2xl bg-surface-hover p-2">
              <GitHubIcon />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-fg">GitHub</h1>
              <p className="mt-1 text-sm text-fg-muted">
                Link repositories and automate issue tracking with pull requests
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
            </div>
          ) : connected ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
                <div className="flex items-start gap-3 px-5 py-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-fg">
                      Connected{conn.account ? ` to ${conn.account}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted leading-relaxed">
                      PRs that reference an issue (e.g.{" "}
                      <code className="font-mono text-fg">ALG-12</code>) move it
                      to Done automatically.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-t border-glass-border px-5 py-3">
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-1.5 text-sm text-brand hover:text-brand/70 disabled:opacity-50 transition-colors"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Configure repositories
                  </button>
                  <span className="text-fg-subtle select-none">·</span>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                  >
                    {disconnecting ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              </div>

              {error && <ErrorMsg msg={error} />}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-fg">
                    Accessible repositories
                    {repos && (
                      <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-xs text-fg-muted">
                        {repos.length}
                      </span>
                    )}
                  </h2>
                  <a
                    href={`https://github.com/apps`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-brand hover:text-brand/70 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Manage on GitHub
                  </a>
                </div>

                {reposLoading ? (
                  <div className="flex items-center justify-center rounded-xl border border-glass-border bg-surface/40 py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
                  </div>
                ) : repos?.length ? (
                  <div className="flex flex-col gap-2">
                    {repos.map((repo) => (
                      <RepoCard key={repo.fullName} repo={repo} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-glass-border bg-surface/40 py-8 text-center text-sm text-fg-muted">
                    No repositories found. Configure access on GitHub.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-glass-border bg-surface/40 p-5">
              <p className="mb-4 text-sm font-medium text-fg">
                What you get with GitHub
              </p>
              <ul className="mb-5 flex flex-col gap-2.5">
                {[
                  "Link repositories to projects when creating them",
                  "Pull requests referencing an issue ID (e.g. ALG-12) move it to Done",
                  "See PR status and merge state directly on issues",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-fg-muted"
                  >
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-fg-muted" />
                    {item}
                  </li>
                ))}
              </ul>
              {error && <ErrorMsg msg={error} className="mb-4" />}
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60 transition-colors"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Connect GitHub
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorMsg({ msg, className = "" }) {
  return (
    <p className={`flex items-center gap-1.5 text-sm text-red-400 ${className}`}>
      <AlertCircle className="h-4 w-4 shrink-0" />
      {msg}
    </p>
  );
}
