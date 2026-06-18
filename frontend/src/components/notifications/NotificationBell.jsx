import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Bell } from "lucide-react";
import Popover from "../ui/Popover.jsx";
import { notificationService } from "../../services/notificationService.js";
import { markOneRead, markAllRead } from "../../redux/notificationSlice.js";

const timeAgo = (value) => {
  const s = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, unread } = useSelector((s) => s.notification);

  const openItem = (n, close) => {
    if (!n.read) {
      notificationService.read(n.id).catch(() => {});
      dispatch(markOneRead(n.id));
    }
    if (n.link) navigate(n.link);
    close();
  };

  const readAll = () => {
    notificationService.readAll().catch(() => {});
    dispatch(markAllRead());
  };

  return (
    <Popover
      align="right"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          aria-label="Notifications"
          className="relative rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-fg">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <div className="w-80 max-w-[90vw] z-50">
          <div className="flex items-center justify-between border-b border-glass-border px-3 py-2">
            <span className="text-sm font-semibold text-fg">Notifications</span>
            {unread > 0 && (
              <button onClick={readAll} className="text-xs text-brand hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-fg-subtle">
                You&rsquo;re all caught up
              </p>
            ) : (
              items.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n, close)}
                  className={`flex w-full gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-hover ${
                    n.read ? "" : "bg-brand/5"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? "bg-transparent" : "bg-brand"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{n.title}</span>
                    {n.body && (
                      <span className="block truncate text-xs text-fg-muted">{n.body}</span>
                    )}
                    <span className="mt-0.5 block text-[11px] text-fg-subtle">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => {
              navigate("/inbox");
              close();
            }}
            className="w-full border-t border-glass-border px-3 py-2 text-center text-xs font-medium text-brand hover:bg-surface-hover"
          >
            Open inbox
          </button>
        </div>
      )}
    </Popover>
  );
}
