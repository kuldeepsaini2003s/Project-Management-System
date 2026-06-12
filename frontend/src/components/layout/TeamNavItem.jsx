import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight, CircleDot, Box } from "lucide-react";
import { useGetTeamProjectsQuery } from "../../store/apiSlice.js";

function TeamGlyph({ team }) {
  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
      style={{ backgroundColor: team.color || "#5e6ad2" }}
    >
      {team.icon || team.key?.[0] || "T"}
    </span>
  );
}

const subClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md py-1.5 pl-9 pr-2 text-sm transition-colors ${
    isActive ? "bg-surface-hover font-medium text-fg" : "text-fg-muted hover:bg-surface-hover hover:text-fg"
  }`;

export default function TeamNavItem({ team, onNavigate }) {
  const [open, setOpen] = useState(false);

  // Cached: fetched only once the team is expanded.
  const { data: projects } = useGetTeamProjectsQuery(team.id, { skip: !open });

  const toggle = () => setOpen((o) => !o);

  return (
    <div>
      <div className="group flex w-full items-center gap-1 rounded-md pr-1 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg">
        <button
          onClick={toggle}
          className="rounded p-1 text-fg-subtle hover:text-fg"
          title={open ? "Collapse" : "Expand"}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>
        <NavLink
          to={`/teams/${team.id}`}
          onClick={onNavigate}
          end
          className={({ isActive }) =>
            `flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 ${
              isActive ? "font-medium text-fg" : ""
            }`
          }
        >
          <TeamGlyph team={team} />
          <span className="flex-1 truncate text-left">{team.name}</span>
        </NavLink>
      </div>

      {open && (
        <div className="mt-0.5">
          <NavLink to={`/teams/${team.id}/issues`} className={subClass} onClick={onNavigate}>
            <CircleDot className="h-3.5 w-3.5" />
            Issues
          </NavLink>
          <NavLink to={`/teams/${team.id}/projects`} className={subClass} onClick={onNavigate} end>
            <Box className="h-3.5 w-3.5" />
            Projects
          </NavLink>

          {projects?.map((p) => (
            <NavLink
              key={p.id}
              to={`/projects/${p.id}`}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md py-1.5 pl-[3.25rem] pr-2 text-sm transition-colors ${
                  isActive ? "bg-surface-hover font-medium text-fg" : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                }`
              }
              onClick={onNavigate}
            >
              <span className="text-sm leading-none">{p.icon || "📦"}</span>
              <span className="truncate">{p.name}</span>
            </NavLink>
          ))}

        </div>
      )}
    </div>
  );
}
