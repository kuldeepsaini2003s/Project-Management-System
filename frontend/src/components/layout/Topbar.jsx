import { Bell, Menu } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle.jsx";

export default function Topbar({ breadcrumb = [], actions, onMenu }) {
  return (
    <header className="glass flex h-12 shrink-0 items-center gap-2 rounded-lg px-3">
      <button
        onClick={onMenu}
        className="rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-fg-subtle">/</span>}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "truncate font-medium text-fg"
                  : "truncate text-fg-muted"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        {actions}
        <ThemeToggle className="!h-8 !w-8 !border-0 bg-transparent" />
        <button
          className="rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
