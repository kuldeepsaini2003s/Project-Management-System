import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  SlidersHorizontal,
  UserCircle,
  Bell,
  ShieldCheck,
  Link2,
  Tag,
  CircleDot,
  Building2,
  LayoutGrid,
  Users,
} from "lucide-react";

const navItemClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-surface-hover font-medium text-fg"
      : "text-fg-muted hover:bg-surface-hover hover:text-fg"
  }`;

function SectionLabel({ children }) {
  return (
    <div className="px-2.5 pb-1 pt-4 first:pt-1">
      <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
        {children}
      </span>
    </div>
  );
}

function NavItem({ to, icon: Icon, children, onClose }) {
  return (
    <NavLink to={to} className={navItemClass} onClick={onClose}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </NavLink>
  );
}

export default function SettingsSidebar({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-y-auto py-3 px-2">
      <button
        onClick={() => navigate("/", { replace: true })}
        className="mb-3 flex items-center gap-1.5 px-2.5 py-1 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to app</span>
      </button>

      <SectionLabel>Personal</SectionLabel>
      <NavItem to="/settings/preferences" icon={SlidersHorizontal} onClose={onClose}>Preferences</NavItem>
      <NavItem to="/settings/profile" icon={UserCircle} onClose={onClose}>Profile</NavItem>
      <NavItem to="/settings/notifications" icon={Bell} onClose={onClose}>Notifications</NavItem>
      <NavItem to="/settings/security" icon={ShieldCheck} onClose={onClose}>Security &amp; access</NavItem>
      <NavItem to="/settings/accounts" icon={Link2} onClose={onClose}>Connected accounts</NavItem>

      <SectionLabel>Issues</SectionLabel>
      <NavItem to="/settings/issues/labels" icon={Tag} onClose={onClose}>Labels</NavItem>

      <SectionLabel>Projects</SectionLabel>
      <NavItem to="/settings/projects/labels" icon={Tag} onClose={onClose}>Labels</NavItem>
      <NavItem to="/settings/projects/statuses" icon={CircleDot} onClose={onClose}>Statuses</NavItem>

      <SectionLabel>Administration</SectionLabel>
      <NavItem to="/settings/workspace" icon={Building2} onClose={onClose}>Workspace</NavItem>
      <NavItem to="/settings/teams" icon={LayoutGrid} onClose={onClose}>Teams</NavItem>
      <NavItem to="/settings/members" icon={Users} onClose={onClose}>Members</NavItem>
    </div>
  );
}
