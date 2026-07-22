import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
  Mail,
  Loader2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Unplug,
  ArrowLeft,
  Flame,
  PenSquare,
  Calendar,
  HelpCircle,
  Newspaper,
  Receipt,
  Tag,
  Bell,
  User as UserIcon,
  Inbox as InboxIcon,
} from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import Button from "../components/ui/Button.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { connectOAuthPopup } from "../utils/oauthPopup.js";
import { errMsg } from "../redux/apiSlice.js";
import {
  useGetGmailConnectionQuery,
  useLazyGetGmailAuthorizeQuery,
  useDisconnectGmailMutation,
  useRunInboxZeroMutation,
  useGetInboxZeroStatusQuery,
  useGetInboxZeroOverviewQuery,
} from "../redux/apiSlice.js";

const FEATURE_NAME = "Brainbox";

const URGENCY_STYLE = {
  URGENT: "bg-danger/10 text-danger",
  NEEDS_RESPONSE: "bg-warning/10 text-warning",
  FYI: "bg-brand/10 text-brand",
  LOW: "bg-surface-hover text-fg-subtle",
};
const URGENCY_DOT = {
  URGENT: "bg-danger",
  NEEDS_RESPONSE: "bg-warning",
  FYI: "bg-brand",
  LOW: "bg-fg-subtle",
};
const URGENCY_LABEL = {
  URGENT: "Urgent",
  NEEDS_RESPONSE: "Needs response",
  FYI: "FYI",
  LOW: "Low priority",
};

const CATEGORY_LABEL = {
  MEETING: "Meetings",
  QUESTION: "Questions",
  NEWSLETTER: "Newsletters",
  TRANSACTIONAL: "Transactional",
  PROMOTION: "Promotions",
  NOTIFICATION: "Notifications",
  PERSONAL: "Personal",
  OTHER: "Other",
};
const CATEGORY_ICON = {
  MEETING: Calendar,
  QUESTION: HelpCircle,
  NEWSLETTER: Newspaper,
  TRANSACTIONAL: Receipt,
  PROMOTION: Tag,
  NOTIFICATION: Bell,
  PERSONAL: UserIcon,
  OTHER: Mail,
};

const STEP_LABEL = {
  fetching: "Fetching your recent inbox…",
  classifying: "Classifying emails with AI…",
  drafting: "Writing draft replies…",
};

const timeAgo = (value) => {
  const s = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  const h = Math.floor(s / 3600);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const fullDate = (value) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const UrgencyBadge = ({ urgency }) => (
  <span
    className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${URGENCY_STYLE[urgency] || URGENCY_STYLE.LOW}`}
  >
    {URGENCY_LABEL[urgency] || "—"}
  </span>
);

export default function InboxZeroPage() {
  const { onMenu } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [seen, setSeen] = useState(() => new Set());

  const { data: conn, isLoading: connLoading, refetch: refetchConn } = useGetGmailConnectionQuery();
  const connected = !!conn?.connected;

  const {
    data: overview,
    isFetching: overviewLoading,
    refetch: refetchOverview,
  } = useGetInboxZeroOverviewQuery(undefined, { skip: !connected });

  const [pollMs, setPollMs] = useState(0);
  const { data: runStatus, refetch: refetchStatus } = useGetInboxZeroStatusQuery(undefined, {
    skip: !connected,
    pollingInterval: pollMs,
  });
  const isRunning = runStatus?.status === "pending";

  useEffect(() => {
    setPollMs(isRunning ? 2500 : 0);
  }, [isRunning]);

  const [wasRunning, setWasRunning] = useState(false);
  useEffect(() => {
    if (wasRunning && !isRunning) {
      refetchOverview();
      setSelectedId(null);
    }
    setWasRunning(isRunning);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Full-page redirect fallback lands back here with ?gmail=…
  useEffect(() => {
    const status = searchParams.get("gmail");
    if (!status) return;
    if (status === "error") setError(searchParams.get("message") || "Gmail connection failed");
    setSearchParams({}, { replace: true });
    refetchConn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const folders = useMemo(() => {
    if (!overview) return [];
    const list = [
      { key: "priority", label: "Priority", icon: Flame, items: overview.top || [] },
      { key: "drafts", label: "Drafts", icon: PenSquare, items: overview.drafts || [] },
    ];
    for (const g of overview.triage || []) {
      list.push({
        key: g.category,
        label: CATEGORY_LABEL[g.category] || g.category,
        icon: CATEGORY_ICON[g.category] || Mail,
        items: g.items || [],
      });
    }
    return list;
  }, [overview]);

  // Keep the active folder valid as fresh triage results replace old ones.
  useEffect(() => {
    if (!folders.length) return;
    if (folders.some((f) => f.key === activeFolder)) return;
    const firstNonEmpty = folders.find((f) => f.items.length > 0) || folders[0];
    setActiveFolder(firstNonEmpty.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders]);

  const currentFolder = folders.find((f) => f.key === activeFolder) || folders[0] || null;
  const items = currentFolder?.items || [];
  const selected = items.find((e) => e.id === selectedId) || null;

  const selectFolder = (key) => {
    setActiveFolder(key);
    setSelectedId(null);
  };

  const selectEmail = (e) => {
    setSelectedId(e.id);
    setSeen((prev) => (prev.has(e.id) ? prev : new Set(prev).add(e.id)));
  };

  const [fetchAuthorize] = useLazyGetGmailAuthorizeQuery();
  const [disconnectGmail, { isLoading: disconnecting }] = useDisconnectGmailMutation();
  const [runTriage, { isLoading: startingRun }] = useRunInboxZeroMutation();

  const handleConnect = async () => {
    setError("");
    setConnecting(true);
    try {
      const result = await connectOAuthPopup({
        provider: "gmail",
        fetchAuthorize: () => fetchAuthorize().unwrap(),
      });
      if (result.status === "error") setError(result.message || "Gmail connection failed");
      if (result.status === "connected" || result.status === "reconnected") refetchConn();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Disconnect Gmail? Your ${FEATURE_NAME} results will be removed (Gmail drafts stay in Gmail).`))
      return;
    setError("");
    try {
      await disconnectGmail().unwrap();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const handleRun = async () => {
    setError("");
    try {
      await runTriage().unwrap();
      refetchStatus();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const runFailed = runStatus?.status === "failed";
  const hasResults = (overview?.total || 0) > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[FEATURE_NAME]}
        onMenu={onMenu}
        actions={
          connected && (
            <Button
              className="!w-auto px-3 text-sm"
              onClick={handleRun}
              disabled={isRunning || startingRun}
              isLoading={startingRun}
            >
              {!startingRun &&
                (isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />)}
              <span className="hidden sm:inline">{isRunning ? "Running…" : hasResults ? "Re-run" : "Run triage"}</span>
            </Button>
          )
        }
      />

      {error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {connLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-fg-muted" />
        </div>
      ) : !connected ? (
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-3">
          <ConnectCard onConnect={handleConnect} connecting={connecting} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="glass flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl px-4 py-2 text-sm">
            <span className="flex items-center gap-2 text-fg">
              <Mail className="h-4 w-4 text-brand" />
              <span className="truncate">{conn.googleEmail}</span>
            </span>
            {conn.lastSyncedAt && (
              <span className="hidden text-xs text-fg-subtle sm:inline">Synced {timeAgo(conn.lastSyncedAt)} ago</span>
            )}
            <span className="hidden items-center gap-1.5 text-xs text-fg-subtle md:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Drafts only — nothing is ever sent without you
            </span>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-hover hover:text-danger disabled:opacity-60"
            >
              {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
              Disconnect
            </button>
          </div>

          {isRunning && (
            <div className="glass flex shrink-0 items-center gap-3 rounded-xl px-4 py-3">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">{STEP_LABEL[runStatus?.step] || "Running the pipeline…"}</p>
                <p className="text-xs text-fg-muted">
                  {runStatus?.totalFetched
                    ? `${runStatus.totalFetched} emails fetched · ${runStatus.classified || 0} classified · ${runStatus.draftsCreated || 0} drafts`
                    : "This usually takes under a minute. You can leave this page — it keeps running."}
                </p>
              </div>
            </div>
          )}

          {runFailed && !isRunning && (
            <p className="flex shrink-0 items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Last run failed: {runStatus?.error || "unknown error"}
            </p>
          )}

          {overviewLoading && !hasResults ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
            </div>
          ) : !hasResults && !isRunning ? (
            <div className="flex flex-1 items-center justify-center overflow-y-auto p-3">
              <EmptyState onRun={handleRun} starting={startingRun} />
            </div>
          ) : hasResults ? (
            <div className="glass flex min-h-0 flex-1 overflow-hidden rounded-lg">
              <nav className="hidden w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-glass-border p-2 lg:flex">
                {folders.map((f) => {
                  const Icon = f.icon;
                  const active = f.key === activeFolder;
                  return (
                    <button
                      key={f.key}
                      onClick={() => selectFolder(f.key)}
                      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                        active ? "bg-brand/10 font-medium text-brand" : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{f.label}</span>
                      {f.items.length > 0 && (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] ${
                            active ? "bg-brand/15" : "bg-surface-hover text-fg-subtle"
                          }`}
                        >
                          {f.items.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div
                className={`flex w-full shrink-0 flex-col overflow-hidden border-r border-glass-border lg:w-96 ${
                  selected ? "hidden lg:flex" : "flex"
                }`}
              >
                <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-glass-border px-2.5 py-2 lg:hidden">
                  {folders.map((f) => {
                    const Icon = f.icon;
                    const active = f.key === activeFolder;
                    return (
                      <button
                        key={f.key}
                        onClick={() => selectFolder(f.key)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          active ? "border-brand bg-brand/10 text-brand" : "border-glass-border text-fg-muted"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {f.label}
                        {f.items.length > 0 && ` · ${f.items.length}`}
                      </button>
                    );
                  })}
                </div>

                <header className="hidden shrink-0 items-center justify-between border-b border-glass-border px-4 py-2.5 lg:flex">
                  <h2 className="text-sm font-semibold text-fg">{currentFolder?.label}</h2>
                  <span className="text-xs text-fg-subtle">{items.length}</span>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-fg-subtle">
                      <InboxIcon className="h-8 w-8" />
                      <p className="text-sm">No emails here</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-glass-border">
                      {items.map((e) => {
                        const active = e.id === selectedId;
                        const unread = !seen.has(e.id);
                        return (
                          <li key={e.id}>
                            <button
                              onClick={() => selectEmail(e)}
                              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover ${
                                active ? "bg-brand/10" : ""
                              }`}
                            >
                              <Avatar name={e.fromName || e.fromEmail} size="md" className="mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`truncate text-sm ${unread ? "font-semibold text-fg" : "text-fg-muted"}`}>
                                    {e.fromName || e.fromEmail}
                                  </span>
                                  {e.topRank && (
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">
                                      {e.topRank}
                                    </span>
                                  )}
                                  <span className="ml-auto shrink-0 text-[11px] text-fg-subtle">{timeAgo(e.receivedAt)}</span>
                                </div>
                                <p className={`truncate text-sm ${unread ? "font-medium text-fg" : "text-fg-muted"}`}>
                                  {e.subject}
                                </p>
                                <div className="mt-0.5 flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${URGENCY_DOT[e.urgency] || URGENCY_DOT.LOW}`} />
                                  <p className="truncate text-xs text-fg-subtle">{e.reason || e.snippet}</p>
                                  {e.draftId && <PenSquare className="h-3 w-3 shrink-0 text-brand" />}
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              <div className={`min-w-0 flex-1 flex-col overflow-hidden ${selected ? "flex" : "hidden lg:flex"}`}>
                {!selected ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-fg-subtle">
                    <Mail className="h-10 w-10" />
                    <p className="text-sm">Select an email to read it</p>
                  </div>
                ) : (
                  <EmailDetail email={selected} onBack={() => setSelectedId(null)} />
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ConnectCard({ onConnect, connecting }) {
  return (
    <div className="glass-card mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Mail className="h-7 w-7" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-fg">{FEATURE_NAME}</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">
          Grant read + draft access to your Gmail and AI will triage your recent inbox, build a 5-item
          "must do today" list, and write draft replies for routine emails — saved as Gmail drafts for you to review.
        </p>
      </div>
      <Button className="!w-auto px-5" onClick={onConnect} disabled={connecting} isLoading={connecting}>
        {!connecting && <Mail className="h-4 w-4" />}
        Connect Gmail
      </Button>
      <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        Read + draft access only. The app never has permission to send email.
      </p>
    </div>
  );
}

function EmptyState({ onRun, starting }) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 rounded-xl px-6 py-14 text-center">
      <Sparkles className="h-6 w-6 text-brand" />
      <p className="text-sm font-medium text-fg">Ready when you are</p>
      <p className="max-w-sm text-xs text-fg-muted">
        Run your first triage to analyze the last 7 days of your inbox, surface what actually matters today,
        and draft replies to the routine stuff.
      </p>
      <Button className="!w-auto px-5" onClick={onRun} disabled={starting} isLoading={starting}>
        {!starting && <Sparkles className="h-4 w-4" />}
        Run triage
      </Button>
    </div>
  );
}

function EmailDetail({ email: e, onBack }) {
  const draftLink = e.draftMessageId
    ? `https://mail.google.com/mail/u/0/#drafts/${e.draftMessageId}`
    : "https://mail.google.com/mail/u/0/#drafts";
  const originalLink = `https://mail.google.com/mail/u/0/#all/${e.gmailId}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-glass-border px-3 py-2.5">
        <button
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-md p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <UrgencyBadge urgency={e.urgency} />
        <span className="hidden shrink-0 rounded-full bg-surface-hover px-2 py-0.5 text-[11px] font-medium text-fg-muted sm:inline-block">
          {CATEGORY_LABEL[e.category] || "Other"}
        </span>
        <a
          href={originalLink}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex shrink-0 items-center gap-1 text-xs text-brand hover:underline"
        >
          <span className="hidden sm:inline">Open in Gmail</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <Avatar name={e.fromName || e.fromEmail} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold leading-snug text-fg">{e.subject}</h1>
            <p className="mt-1 truncate text-sm text-fg">
              <span className="font-medium">{e.fromName || e.fromEmail}</span>
              {e.fromName && <span className="text-fg-subtle"> &lt;{e.fromEmail}&gt;</span>}
            </p>
            <p className="text-xs text-fg-subtle">{fullDate(e.receivedAt)}</p>
          </div>
        </div>

        {e.reason && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand/5 px-3 py-2 text-sm text-fg">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>{e.reason}</span>
          </div>
        )}

        <div className="mt-5 whitespace-pre-wrap border-t border-glass-border pt-5 text-sm leading-relaxed text-fg">
          {e.body || e.snippet || "No preview available for this email — open it in Gmail to read the full message."}
        </div>

        {e.draftBody && (
          <div className="mt-6 rounded-xl border border-brand/20 bg-brand/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <PenSquare className="h-4 w-4 shrink-0 text-brand" />
              <span className="text-sm font-semibold text-fg">AI drafted reply</span>
              <span className="ml-auto shrink-0 text-[11px] text-fg-subtle">Saved in Gmail — not sent</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{e.draftBody}</p>
            <a
              href={draftLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              Review &amp; send in Gmail
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
