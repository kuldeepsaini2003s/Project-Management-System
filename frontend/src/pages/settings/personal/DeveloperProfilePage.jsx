import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Copy, Check, AlertCircle, Sparkles } from "lucide-react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import SettingsRow from "../../../components/settings/SettingsRow.jsx";
import Button from "../../../components/ui/Button.jsx";
import IntegrationRow, { GitHubIcon } from "../../../components/settings/IntegrationRow.jsx";
import GitPersonaCard from "../../../components/git-persona/GitPersonaCard.jsx";
import { useWorkspace } from "../../../context/WorkspaceContext.jsx";
import {
  useGetWorkspaceTeamsQuery,
  useGetTeamGithubQuery,
  useLazyGetTeamGithubAuthorizeQuery,
  useDisconnectTeamGithubMutation,
  useGetGitPersonaCardQuery,
  useGenerateGitPersonaCardMutation,
  useGetGitPersonaGenerationStatusQuery,
  useSetGitPersonaVisibilityMutation,
} from "../../../redux/apiSlice.js";

export default function DeveloperProfilePage() {
  const { currentId } = useWorkspace();
  const { data: teams = [], isLoading: teamsLoading } = useGetWorkspaceTeamsQuery(currentId, { skip: !currentId });
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const teamId = selectedTeamId || teams[0]?.id || "";

  // Same query as Connected accounts, same cache tag — connecting from either
  // page updates both instantly.
  const { data: conn } = useGetTeamGithubQuery(teamId, { skip: !teamId });

  const {
    data: card,
    isFetching: cardLoading,
    error: cardError,
    refetch: refetchCard,
  } = useGetGitPersonaCardQuery(undefined, { skip: !conn?.connected });

  // Generation runs in the background on the server (15-30s), so the source
  // of truth for "is a generation running" lives server-side, not in local
  // component state — that's what makes this survive the user navigating
  // away and coming back: on remount this query just re-fetches the real
  // status instead of defaulting to "not generating" and showing a plain
  // Generate button over a run that's still actually in flight.
  const [pollMs, setPollMs] = useState(0);
  const { data: genStatus, refetch: refetchStatus } = useGetGitPersonaGenerationStatusQuery(undefined, {
    skip: !conn?.connected,
    pollingInterval: pollMs,
  });
  const isPending = genStatus?.status === "pending";
  const isFailed = genStatus?.status === "failed";

  useEffect(() => {
    setPollMs(isPending ? 3000 : 0);
  }, [isPending]);

  // The moment the backend reports the generation is no longer pending, pull
  // the finished card in.
  const [wasPending, setWasPending] = useState(false);
  useEffect(() => {
    if (wasPending && !isPending) refetchCard();
    setWasPending(isPending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  const [generateCard, { isLoading: kickingOff }] = useGenerateGitPersonaCardMutation();
  const [setVisibility, { isLoading: togglingVisibility }] = useSetGitPersonaVisibilityMutation();

  const [generateError, setGenerateError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerateError("");
    try {
      // Kicks off the background job (or reports one's already running —
      // either way this is idempotent, so a stray double-click or a stale
      // page coming back to life can't start a duplicate). Doesn't return
      // the card itself; polling picks up the result.
      await generateCard().unwrap();
      refetchStatus();
    } catch (err) {
      setGenerateError(err?.data?.message || "Failed to start generating your developer card");
    }
  };

  const publicUrl = card?.githubLogin ? `${window.location.origin}/dev/${card.githubLogin}` : "";

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const noCardYet = cardError?.status === 404;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader
        title="Developer profile"
        description="Generate an AI-built developer identity card — your coding style, strengths, growth arc, and a personalized 6-month roadmap — from your team's connected GitHub repos."
      />

      {/* Team picker — only shown when user is in multiple teams, same as Connected accounts */}
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
          Join or create a team first to connect GitHub.
        </div>
      ) : (
        <SettingsSection>
          <IntegrationRow
            icon={<GitHubIcon />}
            name="GitHub"
            description="Connect your Github account to generate a developer card."
            teamId={teamId}
            useConn={useGetTeamGithubQuery}
            useAuth={useLazyGetTeamGithubAuthorizeQuery}
            useDisconn={useDisconnectTeamGithubMutation}
          />

          {conn?.connected && card && !noCardYet && (
            <SettingsRow
              label="Public link"
              description="Anyone with this link can view your card, like a LinkedIn profile."
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisibility(!card.public)}
                  disabled={togglingVisibility}
                  className="rounded-md border border-glass-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-hover disabled:opacity-60 transition-colors"
                >
                  {!card.public ? "Public" : "Private"}
                </button>
                {card.public && (
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 rounded-md border border-glass-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-hover transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                )}
              </div>
            </SettingsRow>
          )}
        </SettingsSection>
      )}

      {/* Generate / regenerate + card */}
      {conn?.connected && (
        <div className="mt-5 flex flex-col gap-4">
          {generateError && (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="h-3.5 w-3.5" />
              {generateError}
            </p>
          )}

          {isPending ? (
            <div className="glass-card flex flex-col items-center gap-3 rounded-xl px-6 py-14 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <p className="text-sm font-medium text-fg">Analyzing your GitHub activity…</p>
              <p className="max-w-xs text-xs text-fg-muted">
                Reading commits, languages, and repo history across your team's connected repos. This takes
                about 15–30 seconds — feel free to navigate away, it'll keep running and be here when you're back.
              </p>
            </div>
          ) : cardLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
            </div>
          ) : noCardYet || !card ? (
            <div className="glass-card flex flex-col items-center gap-3 rounded-xl px-6 py-14 text-center">
              <Sparkles className="h-6 w-6 text-brand" />
              <p className="text-sm font-medium text-fg">
                {isFailed ? "Generation failed" : "You haven't generated a card yet"}
              </p>
              <p className="max-w-xs text-xs text-fg-muted">
                {isFailed
                  ? genStatus?.error || "Something went wrong generating your card."
                  : "We'll analyze the commits you've authored across your team's connected repositories."}
              </p>
              <Button className="!w-auto px-5" onClick={handleGenerate} disabled={kickingOff}>
                {kickingOff ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFailed ? (
                  "Try again"
                ) : (
                  "Generate my developer card"
                )}
              </Button>
            </div>
          ) : (
            <>
              <GitPersonaCard card={card} avatarUrl={card.avatarUrl} name={card.name || card.githubLogin} />
              {isFailed && (
                <p className="flex items-center gap-1.5 text-xs text-danger">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Last regeneration failed: {genStatus?.error || "unknown error"}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={kickingOff}
                  className="flex items-center gap-1.5 rounded-md border border-glass-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-hover disabled:opacity-60 transition-colors"
                >
                  {kickingOff ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
