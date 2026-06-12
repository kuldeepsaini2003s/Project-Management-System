import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, LogOut, Settings } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../ui/Avatar.jsx";

function WorkspaceGlyph({ name }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-xs font-bold text-brand-fg">
      {name?.trim()[0]?.toUpperCase() || "W"}
    </span>
  );
}

export default function WorkspaceSwitcher({ onCreateWorkspace }) {
  const { workspaces, current, switchWorkspace } = useWorkspace();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-hover"
      >
        <WorkspaceGlyph name={current?.name} />
        <span className="flex-1 truncate text-sm font-semibold text-fg">
          {current?.name || "Workspace"}
        </span>
        <ChevronDown className="h-4 w-4 text-fg-subtle" />
      </button>

      {open && (
        <div className="glass-strong absolute left-0 top-full z-40 mt-1 w-64 rounded-lg p-1.5 shadow-2xl">
          <div className="px-2 py-1.5">
            <p className="truncate text-xs text-fg-subtle">{user?.email}</p>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  switchWorkspace(w.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-hover"
              >
                <WorkspaceGlyph name={w.name} />
                <span className="flex-1 truncate text-sm text-fg">{w.name}</span>
                {w.id === current?.id && <Check className="h-4 w-4 text-brand" />}
              </button>
            ))}
          </div>

          <div className="my-1 h-px bg-glass-border" />

          <button
            onClick={() => {
              setOpen(false);
              onCreateWorkspace?.();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
          >
            <Plus className="h-4 w-4" />
            Create workspace
          </button>

          <div className="my-1 h-px bg-glass-border" />

          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar name={user?.name} src={user?.avatarUrl} size="md" />
            <span className="flex-1 truncate text-sm text-fg">{user?.name}</span>
          </div>
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg-subtle"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
