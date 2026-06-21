import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import {
  useGetTeamNotionQuery,
  useLazyGetTeamNotionAuthorizeQuery,
  useDisconnectTeamNotionMutation,
} from "../../redux/apiSlice.js";

const NotionIcon = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
  </svg>
);

export default function NotionIntegrationPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const {
    data: conn,
    isLoading,
    refetch,
  } = useGetTeamNotionQuery(teamId, { skip: !teamId });
  const [authorize] = useLazyGetTeamNotionAuthorizeQuery();
  const [disconnect, { isLoading: disconnecting }] =
    useDisconnectTeamNotionMutation();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connected = !!conn?.connected;
  const workspaceName = conn?.workspaceName;

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const result = await authorize(teamId);
      if (result.error)
        throw new Error(result.error?.data?.message || "Failed to connect");
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
      {/* Full-width navbar with notification bell */}
      <Topbar breadcrumb={["Notion"]} onMenu={onMenu} />

      {/* Centered content */}
      <div className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-5 flex gap-4">
            <div className="flex flex-col h-fit w-fit p-2 items-center rounded-2xl bg-surface-hover">
              <NotionIcon />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-fg">Notion</h1>
              <p className="mt-1 text-sm text-fg-muted">
                Preview issues and projects directly inside Notion documents
              </p>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
            </div>
          ) : connected ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
                <div className="flex items-start gap-3 px-5 py-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-fg">
                      Connected to {workspaceName || "Notion"}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted leading-relaxed">
                      Paste issue or project links in Notion to see rich previews
                      with status, assignee, and priority.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-t border-glass-border px-5 py-3">
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
            </div>
          ) : (
            <div className="rounded-xl border border-glass-border bg-surface/40 p-5">
              <p className="mb-4 text-sm font-medium text-fg">
                What you get with Notion
              </p>
              <ul className="mb-5 flex flex-col gap-2.5">
                {[
                  "Rich link previews when you paste issue or project URLs in Notion",
                  "See issue status, assignee, and priority inline in your docs",
                  "Keep your Notion documents and issues in sync",
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
                Connect Notion
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
