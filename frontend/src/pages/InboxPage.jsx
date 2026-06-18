import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { CircleDot, MessageSquare, Users, Check, Bell, ArrowLeft, ArrowUpRight, AtSign } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import Button from "../components/ui/Button.jsx";
import IssueDetailView from "../components/issues/IssueDetailView.jsx";
import { notificationService } from "../services/notificationService.js";
import { markOneRead, markAllRead } from "../redux/notificationSlice.js";

const issueIdFromLink = (link) => {
  const m = (link || "").match(/^\/issues\/([^/?#]+)/);
  return m ? m[1] : null;
};

const TYPE_ICON = {
  ISSUE_ASSIGNED: CircleDot,
  ISSUE_COMMENT: MessageSquare,
  MENTION: AtSign,
  JOIN_REQUEST: Users,
  JOIN_ACCEPTED: Check,
};

const TYPE_LABEL = {
  ISSUE_ASSIGNED: "Assigned",
  ISSUE_COMMENT: "Comment",
  MENTION: "Mention",
  JOIN_REQUEST: "Join request",
  JOIN_ACCEPTED: "Joined team",
};

const timeAgo = (value) => {
  const s = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fullDate = (value) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function InboxPage() {
  const { onMenu } = useOutletContext() || {};
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, unread } = useSelector((s) => s.notification);
  const [selectedId, setSelectedId] = useState(null);

  const selected = items.find((n) => n.id === selectedId) || null;

  const select = (n) => {
    setSelectedId(n.id);
    if (!n.read) {
      notificationService.read(n.id).catch(() => {});
      dispatch(markOneRead(n.id));
    }
  };

  const readAll = () => {
    notificationService.readAll().catch(() => {});
    dispatch(markAllRead());
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={["Inbox"]}
        onMenu={onMenu}
        actions={
          unread > 0 && (
            <Button variant="ghost" className="!w-auto px-3 text-sm" onClick={readAll}>
              Mark all read
            </Button>
          )
        }
      />

      <div className="glass flex min-h-0 flex-1 overflow-hidden rounded-lg">
        {/* Left: notification list */}
        <div
          className={`min-h-0 w-full shrink-0 overflow-y-auto border-glass-border lg:w-80 lg:border-r ${
            selected ? "hidden lg:block" : "block"
          }`}
        >
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-20 text-fg-subtle">
              <Bell className="h-10 w-10" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-glass-border">
              {items.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                const active = n.id === selectedId;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => select(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover ${
                        active ? "bg-surface-hover" : n.read ? "" : "bg-brand/5"
                      }`}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-fg-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm ${
                            n.read ? "text-fg" : "font-medium text-fg"
                          }`}
                        >
                          {n.title}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block truncate text-xs text-fg-muted">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-0.5 block text-[11px] text-fg-subtle">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: detail — full editable issue when the notification is about one */}
        <div
          className={`min-w-0 flex-1 ${selected ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}
        >
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-fg-subtle">
              <Bell className="h-10 w-10" />
              <p className="text-sm">Select a notification to read it</p>
            </div>
          ) : issueIdFromLink(selected.link) ? (
            <>
              <button
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1.5 border-b border-glass-border px-4 py-2 text-sm text-fg-muted hover:text-fg lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="min-h-0 flex-1">
                <IssueDetailView issueId={issueIdFromLink(selected.link)} />
              </div>
            </>
          ) : (
            <div className="overflow-y-auto">
              <NotificationDetail
                notification={selected}
                onBack={() => setSelectedId(null)}
                onOpen={() => selected.link && navigate(selected.link)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationDetail({ notification: n, onBack, onOpen }) {
  const Icon = TYPE_ICON[n.type] || Bell;
  return (
    <div className="mx-auto max-w-2xl p-6">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-hover text-fg-muted">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
            {TYPE_LABEL[n.type] || "Notification"}
          </span>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-fg">{n.title}</h1>
          <p className="mt-1 text-xs text-fg-subtle">{fullDate(n.createdAt)}</p>
        </div>
      </div>

      {n.body && (
        <p className="mt-5 whitespace-pre-wrap border-t border-glass-border pt-5 text-sm leading-relaxed text-fg-muted">
          {n.body}
        </p>
      )}

      {n.link && (
        <Button className="!w-auto mt-6 px-4" onClick={onOpen}>
          Open
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
