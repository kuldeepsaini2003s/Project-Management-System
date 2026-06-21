import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Hash,
  Users,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import {
  useGetTeamSlackQuery,
  useLazyGetTeamSlackAuthorizeQuery,
  useGetTeamSlackInfoQuery,
  useDisconnectTeamSlackMutation,
} from "../../redux/apiSlice.js";

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A" />
  </svg>
);

function MemberCard({ member }) {
  const initials = (member.name || "?")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-glass-border bg-surface/40 px-4 py-3">
      {member.avatar ? (
        <img src={member.avatar} alt={member.name} className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand">
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{member.name}</p>
        {member.title && (
          <p className="truncate text-xs text-fg-muted">{member.title}</p>
        )}
      </div>
      {member.isAdmin && (
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand" title="Admin" />
      )}
    </div>
  );
}

function ChannelCard({ channel, isConnected }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
      isConnected
        ? "border-brand/40 bg-brand/5"
        : "border-glass-border bg-surface/40"
    }`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        isConnected ? "bg-brand/15 text-brand" : "bg-surface-hover text-fg-muted"
      }`}>
        <Hash className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">
          {channel.name}
          {isConnected && (
            <span className="ml-2 text-xs font-normal text-brand">connected</span>
          )}
        </p>
        {channel.purpose && (
          <p className="truncate text-xs text-fg-muted">{channel.purpose}</p>
        )}
      </div>
      <span className="shrink-0 flex items-center gap-1 text-xs text-fg-subtle">
        <Users className="h-3 w-3" />
        {channel.memberCount}
      </span>
    </div>
  );
}

export default function SlackIntegrationPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const { data: conn, isLoading, refetch } = useGetTeamSlackQuery(teamId, { skip: !teamId });
  const [authorize] = useLazyGetTeamSlackAuthorizeQuery();
  const [disconnect, { isLoading: disconnecting }] = useDisconnectTeamSlackMutation();
  const { data: info, isLoading: infoLoading } = useGetTeamSlackInfoQuery(teamId, {
    skip: !teamId || !conn?.connected,
  });

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connected = !!conn?.connected;
  const workspaceName = conn?.slackTeamName;
  const channel = conn?.channel;

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const result = await authorize(teamId);
      if (result.error) throw new Error(result.error?.data?.message || "Failed to connect");
      if (result.data?.reconnected) refetch();
      else if (result.data?.url) window.location.href = result.data.url;
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
      <Topbar breadcrumb={["Slack"]} onMenu={onMenu} />

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-5 flex gap-4">
            <div className="flex h-fit w-fit shrink-0 items-center rounded-2xl bg-surface-hover p-2">
              <SlackIcon />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-fg">Slack</h1>
              <p className="mt-1 text-sm text-fg-muted">
                Receive notifications when teammates mention or assign you
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
            </div>
          ) : connected ? (
            <div className="flex flex-col gap-4">
              {/* Connection status card */}
              <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
                <div className="flex items-start gap-3 px-5 py-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-fg">
                      Connected to {workspaceName || "Slack"}
                      {channel && <span className="ml-1.5 font-normal text-fg-muted">· #{channel}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted leading-relaxed">
                      Notifications post to {channel ? `#${channel}` : "your channel"} when teammates @mention you.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-t border-glass-border px-5 py-3">
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-1.5 text-sm text-brand hover:text-brand/70 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reconnect / change channel
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

              {/* Info section */}
              {infoLoading ? (
                <div className="flex items-center justify-center rounded-xl border border-glass-border bg-surface/40 py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
                </div>
              ) : info?.needsReconnect ? (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4 text-sm text-fg-muted">
                  Reconnect Slack to see channel members and workspace channels.
                </div>
              ) : (
                <>
                  {/* Channel members */}
                  {info?.members?.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-fg">
                          Members in #{info.channel?.replace("#", "")}
                          <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-xs text-fg-muted">
                            {info.members.length}
                          </span>
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {info.members.map((m) => (
                          <MemberCard key={m.id} member={m} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Workspace channels */}
                  {info?.channels?.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-fg">
                          Workspace channels
                          <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-xs text-fg-muted">
                            {info.channels.length}
                          </span>
                        </h2>
                        <a
                          href="https://slack.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-brand hover:text-brand/70 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open Slack
                        </a>
                      </div>
                      <div className="flex flex-col gap-2">
                        {info.channels.map((ch) => (
                          <ChannelCard
                            key={ch.id}
                            channel={ch}
                            isConnected={ch.name === (info.channel || "").replace("#", "")}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Disconnected */
            <div className="rounded-xl border border-glass-border bg-surface/40 p-5">
              <p className="mb-4 text-sm font-medium text-fg">What you get with Slack</p>
              <ul className="mb-5 flex flex-col gap-2.5">
                {[
                  "Get notified when @mentioned in a comment",
                  "Receive alerts when issues are assigned to you",
                  "Post issue updates to a Slack channel",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-fg-muted">
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
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Connect Slack
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
