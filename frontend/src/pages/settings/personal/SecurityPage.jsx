import { createPortal } from "react-dom";
import { Monitor, Smartphone, Tablet, Globe2, Loader2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  useGetUserSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllOtherSessionsMutation,
} from "../../../redux/apiSlice.js";

function parseDevice(ua = "") {
  const s = ua.toLowerCase();

  let browser = "Browser";
  if (s.includes("edg/") || s.includes("edge/"))   browser = "Edge";
  else if (s.includes("opr/") || s.includes("opera")) browser = "Opera";
  else if (s.includes("chrome"))  browser = "Chrome";
  else if (s.includes("firefox")) browser = "Firefox";
  else if (s.includes("safari"))  browser = "Safari";

  let os = "Unknown OS";
  if (s.includes("windows"))                            os = "Windows";
  else if (s.includes("android"))                       os = "Android";
  else if (s.includes("iphone") || s.includes("ipad")) os = "iOS";
  else if (s.includes("mac os"))                        os = "macOS";
  else if (s.includes("linux"))                         os = "Linux";

  let Icon = Monitor;
  if (s.includes("mobile") || s.includes("android") || s.includes("iphone")) Icon = Smartphone;
  else if (s.includes("ipad") || s.includes("tablet")) Icon = Tablet;

  return { label: `${browser} on ${os}`, Icon };
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-glass-border bg-surface p-5 shadow-2xl">
        <p className="text-sm text-fg">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border border-glass-border px-4 py-1.5 text-sm text-fg-muted hover:bg-surface-hover transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-md bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SessionCard({ session, onRevoke, revoking }) {
  const { label, Icon } = parseDevice(session.userAgent || "");
  const locationStr = session.location || null;

  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-hover">
        <Icon className="h-4 w-4 text-fg-muted" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-fg leading-tight">{label}</span>
        <div className="flex flex-wrap items-center gap-x-1 text-xs text-fg-muted">
          {session.isCurrent && (
            <span className="flex items-center gap-1 font-medium text-green-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
              Current session
            </span>
          )}
          {session.isCurrent && locationStr && <span className="text-fg-subtle">·</span>}
          {locationStr && <span>{locationStr}</span>}
        </div>
      </div>

      {!session.isCurrent && (
        <button
          onClick={() => onRevoke(session.sessionId)}
          disabled={revoking === session.sessionId}
          className="shrink-0 rounded-md border border-glass-border bg-surface/60 px-3 py-1 text-xs font-medium text-fg-muted hover:border-red-400/40 hover:text-red-400 disabled:opacity-50 transition-colors"
        >
          {revoking === session.sessionId ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Revoke"
          )}
        </button>
      )}
    </div>
  );
}

import { useState } from "react";

export default function SecurityPage() {
  const { user } = useAuth();
  const { data: sessions = [], isLoading, refetch } = useGetUserSessionsQuery(user?.id, {
    skip: !user?.id,
    refetchOnMountOrArgChange: true,
  });
  const [revokeSession] = useRevokeSessionMutation();
  const [revokeAllOther] = useRevokeAllOtherSessionsMutation();

  const [revoking, setRevoking]   = useState(null);
  const [confirm, setConfirm]     = useState(null);

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions  = sessions.filter((s) => !s.isCurrent);

  const handleRevoke = (sessionId) => setConfirm({ type: "one", sessionId });
  const handleRevokeAll = () => setConfirm({ type: "all" });

  const doConfirm = async () => {
    const c = confirm;
    setConfirm(null);
    if (c.type === "one") {
      setRevoking(c.sessionId);
      try { await revokeSession({ userId: user.id, sessionId: c.sessionId }).unwrap(); }
      catch {  }
      setRevoking(null);
    } else {
      setRevoking("all");
      try { await revokeAllOther({ userId: user.id }).unwrap(); }
      catch {  }
      setRevoking(null);
    }
    refetch();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-fg">Security &amp; access</h1>

      <div className="flex flex-col gap-6">

        <div>
          <h2 className="mb-0.5 text-base font-semibold text-fg">Sessions</h2>
          <p className="mb-3 text-sm text-fg-muted">Devices logged into your account</p>

          <div className="overflow-hidden rounded-xl border border-glass-border bg-surface/40">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
              </div>
            ) : (
              <>
                {currentSession && (
                  <SessionCard session={currentSession} onRevoke={handleRevoke} revoking={revoking} />
                )}

                {otherSessions.length > 0 && (
                  <>
                    <div className="flex items-center justify-between border-t border-glass-border px-4 py-2">
                      <span className="text-xs text-fg-muted">
                        {otherSessions.length} other session{otherSessions.length > 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={handleRevokeAll}
                        disabled={revoking === "all"}
                        className="text-xs font-medium text-fg-muted hover:text-fg transition-colors disabled:opacity-50"
                      >
                        {revoking === "all" ? "Signing out…" : "Revoke all"}
                      </button>
                    </div>
                    {otherSessions.map((s) => (
                      <div key={s.id} className="border-t border-glass-border">
                        <SessionCard session={s} onRevoke={handleRevoke} revoking={revoking} />
                      </div>
                    ))}
                  </>
                )}

                {sessions.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-fg-muted">No sessions found</div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {confirm && (
        <ConfirmDialog
          message={
            confirm.type === "all"
              ? "This will sign you out of all other active sessions. Continue?"
              : "This will sign out that session. Continue?"
          }
          onConfirm={doConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
