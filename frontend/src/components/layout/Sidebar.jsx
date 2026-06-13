import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Inbox,
  CircleDot,
  Box,
  MoreHorizontal,
  Search,
  PenSquare,
  Plus,
} from "lucide-react";
import WorkspaceSwitcher from "../workspace/WorkspaceSwitcher.jsx";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal.jsx";
import CreateTeamModal from "../team/CreateTeamModal.jsx";
import TeamNavItem from "./TeamNavItem.jsx";
import { useTeams } from "../../context/TeamContext.jsx";

const navItemClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-surface-hover font-medium text-fg"
      : "text-fg-muted hover:bg-surface-hover hover:text-fg"
  }`;

function SectionLabel({ children, action }) {
  return (
    <div className="flex items-center justify-between px-2 pb-1 pt-4">
      <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
        {children}
      </span>
      {action}
    </div>
  );
}

export default function Sidebar({ onClose }) {
  const { teams } = useTeams();
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);

  return (
    <>
      <aside className="glass flex h-full  shrink-0 flex-col gap-1 px-3 py-3">
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <WorkspaceSwitcher onCreateWorkspace={() => setCreateWorkspaceOpen(true)} />
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
          <button className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg">
            <MoreHorizontal className="h-4 w-4" />
            <span className="flex-1 text-left">More</span>
          </button>

          <SectionLabel
            action={
              <button
                onClick={() => setCreateTeamOpen(true)}
                className="rounded p-0.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
                title="Create team"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            }
          >
            Your teams
          </SectionLabel>

          <div className="flex flex-col gap-0.5">
            {teams.map((team) => (
              <TeamNavItem key={team.id} team={team} onNavigate={onClose} />
            ))}
            {teams.length === 0 && (
              <button
                onClick={() => setCreateTeamOpen(true)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg-subtle hover:text-fg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Create your first team
              </button>
            )}
          </div>
        </nav>

        <div className="mt-auto px-2 pt-2 text-xs text-fg-subtle">Free plan</div>
      </aside>

      <CreateWorkspaceModal open={createWorkspaceOpen} onClose={() => setCreateWorkspaceOpen(false)} />
      <CreateTeamModal open={createTeamOpen} onClose={() => setCreateTeamOpen(false)} />
    </>
  );
}
