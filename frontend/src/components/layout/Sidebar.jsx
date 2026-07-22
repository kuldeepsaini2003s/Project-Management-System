import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Inbox,
  CircleDot,
  Box,
  MoreHorizontal,
  Search,
  PenSquare,
  Plus,
  Users,
  LayoutGrid,
  Settings2,
  Github,
  Slack,
  BookText,
  Zap,
  Mail,
} from "lucide-react";
import WorkspaceSwitcher from "../workspace/WorkspaceSwitcher.jsx";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal.jsx";
import CreateTeamModal from "../team/CreateTeamModal.jsx";
import CreateIssueModal from "../issues/CreateIssueModal.jsx";
import CustomizeSidebarModal from "./CustomizeSidebarModal.jsx";
import Popover from "../ui/Popover.jsx";
import TeamNavItem from "./TeamNavItem.jsx";
import { useTeams } from "../../context/TeamContext.jsx";

const navItemClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-brand/10 font-medium text-brand"
      : "text-fg-muted hover:bg-surface-hover hover:text-fg"
  }`;

const tryItemClass =
  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg";

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
  const { teams: teamsFromContext } = useTeams();
  const teams = Array.isArray(teamsFromContext) ? teamsFromContext : [];
  const navigate = useNavigate();
  const prefs = useSelector((s) => s.ui.sidebarPrefs);

  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const firstTeamId = teams[0]?.id;
  const go = (to) => {
    navigate(to);
    onClose?.();
  };

  return (
    <>
      <aside className="glass flex h-full w-64 shrink-0 flex-col gap-1 rounded-2xl px-3 py-3">
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <WorkspaceSwitcher
              onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
            />
          </div>
          <button
            onClick={() => go("/search")}
            className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
            title="Search"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCreateIssueOpen(true)}
            className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
            title="New issue"
            aria-label="New issue"
          >
            <PenSquare className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-2 flex flex-1 flex-col overflow-y-auto">
          {prefs.inbox && (
            <NavLink to="/inbox" className={navItemClass} onClick={onClose}>
              <Inbox className="h-4 w-4" />
              <span className="flex-1">Inbox</span>
            </NavLink>
          )}
          {prefs.myIssues && (
            <NavLink to="/my-issues" className={navItemClass} onClick={onClose}>
              <CircleDot className="h-4 w-4" />
              <span className="flex-1">My Issues</span>
            </NavLink>
          )}
          <NavLink to="/inbox-zero" className={navItemClass} onClick={onClose}>
            <Mail className="h-4 w-4" />
            <span className="flex-1">Brainbox</span>
          </NavLink>

          <SectionLabel>Workspace</SectionLabel>
          {prefs.projects && (
            <NavLink to="/projects" className={navItemClass} onClick={onClose}>
              <Box className="h-4 w-4" />
              <span className="flex-1">Projects</span>
            </NavLink>
          )}
          {prefs.members && (
            <NavLink to="/members" className={navItemClass} onClick={onClose}>
              <Users className="h-4 w-4" />
              <span className="flex-1">Members</span>
            </NavLink>
          )}
          {prefs.teams && (
            <NavLink to="/teams" className={navItemClass} onClick={onClose} end>
              <LayoutGrid className="h-4 w-4" />
              <span className="flex-1">Teams</span>
            </NavLink>
          )}

          <Popover
            trigger={({ toggle }) => (
              <button
                onClick={toggle}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="flex-1 text-left">More</span>
              </button>
            )}
          >
            {({ close }) => (
              <div className="w-52">
                <button
                  onClick={() => {
                    close();
                    go("/members");
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-hover"
                >
                  <Users className="h-4 w-4 text-fg-muted" />
                  Members
                </button>
                <button
                  onClick={() => {
                    close();
                    go("/teams");
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-hover"
                >
                  <LayoutGrid className="h-4 w-4 text-fg-muted" />
                  Teams
                </button>
                <div className="my-1 h-px bg-glass-border" />
                <button
                  onClick={() => {
                    close();
                    setCustomizeOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-hover"
                >
                  <Settings2 className="h-4 w-4 text-fg-muted" />
                  Customize sidebar
                </button>
              </div>
            )}
          </Popover>

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

          {firstTeamId && (
            <>
              <SectionLabel>Integrations</SectionLabel>
              <NavLink
                to={`/teams/${firstTeamId}/integrations/github`}
                className={navItemClass}
                onClick={onClose}
              >
                <Github className="h-4 w-4" />
                <span className="flex-1">GitHub</span>
              </NavLink>
              <NavLink
                to={`/teams/${firstTeamId}/integrations/slack`}
                className={navItemClass}
                onClick={onClose}
              >
                <Slack className="h-4 w-4" />
                <span className="flex-1">Slack</span>
              </NavLink>
              <NavLink
                to={`/teams/${firstTeamId}/integrations/notion`}
                className={navItemClass}
                onClick={onClose}
              >
                <BookText className="h-4 w-4" />
                <span className="flex-1">Notion</span>
              </NavLink>
              <NavLink
                to={`/teams/${firstTeamId}/integrations/mcp`}
                className={navItemClass}
                onClick={onClose}
              >
                <Zap className="h-4 w-4 text-brand" />
                <span className="flex-1">MCP Server</span>
              </NavLink>
            </>
          )}

        </nav>
      </aside>

      <CreateWorkspaceModal
        open={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
      />
      <CreateTeamModal
        open={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
      />
      <CreateIssueModal
        open={createIssueOpen}
        onClose={() => setCreateIssueOpen(false)}
      />
      <CustomizeSidebarModal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
      />
    </>
  );
}
