import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Inbox,
  CircleDot,
  Box,
  LayoutGrid,
  MoreHorizontal,
  Search,
  PenSquare,
  Users,
  ChevronRight,
} from "lucide-react";
import WorkspaceSwitcher from "../workspace/WorkspaceSwitcher.jsx";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

const navItemClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-surface-hover font-medium text-fg"
      : "text-fg-muted hover:bg-surface-hover hover:text-fg"
  }`;

function SectionLabel({ children }) {
  return (
    <div className="px-2 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-fg-subtle">
      {children}
    </div>
  );
}

export default function Sidebar({ onClose }) {
  const { current } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <aside className="glass flex h-full w-60 shrink-0 flex-col gap-1 px-3 py-3">
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <WorkspaceSwitcher onCreateWorkspace={() => setCreateOpen(true)} />
          </div>
          <button
            className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
            title="New issue"
          >
            <PenSquare className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-2 flex flex-1 flex-col overflow-y-auto">
          <NavLink to="/inbox" className={navItemClass} onClick={onClose}>
            <Inbox className="h-4 w-4" />
            <span className="flex-1">Inbox</span>
          </NavLink>
          <NavLink to="/my-issues" className={navItemClass} onClick={onClose}>
            <CircleDot className="h-4 w-4" />
            <span className="flex-1">My Issues</span>
          </NavLink>

          <SectionLabel>Workspace</SectionLabel>
          <NavLink to="/projects" className={navItemClass} onClick={onClose}>
            <Box className="h-4 w-4" />
            <span className="flex-1">Projects</span>
          </NavLink>
          <NavLink to="/views" className={navItemClass} onClick={onClose}>
            <LayoutGrid className="h-4 w-4" />
            <span className="flex-1">Views</span>
          </NavLink>
          <NavLink to="/teams" className={navItemClass} onClick={onClose}>
            <Users className="h-4 w-4" />
            <span className="flex-1">Teams</span>
          </NavLink>
          <button className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg">
            <MoreHorizontal className="h-4 w-4" />
            <span className="flex-1 text-left">More</span>
          </button>

          <SectionLabel>Your teams</SectionLabel>
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-fg-muted">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-brand/80 text-[9px] font-bold text-brand-fg">
              {current?.name?.trim()[0]?.toUpperCase() || "W"}
            </span>
            <span className="flex-1 truncate">{current?.name || "Workspace"}</span>
            <ChevronRight className="h-3.5 w-3.5 text-fg-subtle" />
          </div>
        </nav>

        <div className="mt-auto px-2 pt-2 text-xs text-fg-subtle">Free plan</div>
      </aside>

      <CreateWorkspaceModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
