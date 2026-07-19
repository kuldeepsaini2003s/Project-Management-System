import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Pencil, Trash2, Calendar, Box, Users, Hash } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import ProjectStatusBadge from "../../components/projects/ProjectStatusBadge.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import { PRIORITIES } from "../../constants/priority.js";
import { fetchTeam, fetchTeamMembers } from "../../redux/actions/teamActions.js";
import { fetchWorkspaceLabels } from "../../redux/actions/workspaceActions.js";
import { fetchProject, updateProject, deleteProject } from "../../redux/actions/projectActions.js";
import { fetchProjectIssues } from "../../redux/actions/issueActions.js";
import { Skeleton } from "../../components/ui/Skeleton.jsx";

const fmt = (v) =>
  v ? new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

function PropertyRow({ label, children }) {
  return (
    <div className="flex items-start gap-3 py-2 text-sm">
      <span className="w-20 shrink-0 text-fg-subtle">{label}</span>
      <div className="min-w-0 flex-1 text-fg">{children}</div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};
  const dispatch = useDispatch();

  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const project = useSelector((state) => state.project.current);
  const team = useSelector((state) => state.team.current);
  const workspaceId = useSelector((state) => state.ui.currentWorkspaceId);
  const issues = useSelector((state) => state.issue.projectIssues);
  const loading = useSelector((state) => state.project.loading);

  useEffect(() => {
    setError("");
    dispatch(fetchProject(projectId))
      .then((p) => {
        if (p?.teamId) {
          dispatch(fetchTeam(p.teamId)).catch(() => {});
          dispatch(fetchTeamMembers(p.teamId)).catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
    dispatch(fetchProjectIssues(projectId)).catch(() => {});
  }, [dispatch, projectId]);

  useEffect(() => {
    if (workspaceId) dispatch(fetchWorkspaceLabels(workspaceId)).catch(() => {});
  }, [dispatch, workspaceId]);

  const teamId = project?.teamId;
  const priority = project && (PRIORITIES[project.priority] || PRIORITIES.NONE);
  const onThisProject = project?.id === projectId;

  const handleUpdate = (data) => dispatch(updateProject(projectId, data));

  const handleDelete = async () => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await dispatch(deleteProject(projectId));
      navigate(`/teams/${teamId}/projects`, { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const total = issues.length;
  const started = issues.filter((i) => i.status === "IN_PROGRESS").length;
  const completed = issues.filter((i) => i.status === "DONE").length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[
          { label: team?.name || "Team", to: teamId ? `/teams/${teamId}` : undefined },
          { label: "Projects", to: teamId ? `/teams/${teamId}/projects` : undefined },
          project?.name || "…",
        ]}
        onMenu={onMenu}
        actions={
          onThisProject && (
            <>
              <Button variant="secondary" className="!w-auto px-2.5" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="secondary" className="!w-auto px-2.5" onClick={handleDelete} isLoading={deleting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )
        }
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <FormError message={error} />
        {loading && !onThisProject ? (
          <Skeleton name="project-detail" loading />
        ) : onThisProject ? (
          <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto lg:flex-row lg:overflow-hidden">
            <div className="glass rounded-lg p-5 sm:p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <div className="mx-auto max-w-2xl">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{
                      backgroundColor: (project.color || "#5e6ad2") + "22",
                      color: project.color || "#5e6ad2",
                    }}
                  >
                    {project.icon ? (
                      <span aria-hidden="true">{project.icon}</span>
                    ) : (
                      <Box className="h-6 w-6" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-fg">{project.name}</h1>
                    {project.summary && (
                      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{project.summary}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t border-glass-border pt-5">
                  <h2 className="mb-2 text-sm font-semibold text-fg">Description</h2>
                  {project.description ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-sm text-fg-subtle">No description yet.</p>
                  )}
                </div>
              </div>
            </div>

            <aside className="glass w-full shrink-0 rounded-lg p-4 lg:w-80 lg:overflow-y-auto">
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                Properties
              </h2>
              <div className="divide-y divide-glass-border">
                <PropertyRow label="Status">
                  <ProjectStatusBadge status={project.status} />
                </PropertyRow>
                {priority && priority.label !== "No priority" && (
                  <PropertyRow label="Priority">
                    <span className="inline-flex items-center gap-1.5">
                      <priority.icon className="h-3.5 w-3.5" style={{ color: priority.color }} />
                      {priority.label}
                    </span>
                  </PropertyRow>
                )}
                {project.lead && (
                  <PropertyRow label="Lead">
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar name={project.lead.name} src={project.lead.avatarUrl} size="sm" />
                      <span className="truncate">{project.lead.name}</span>
                    </span>
                  </PropertyRow>
                )}
                {project.members?.length > 0 && (
                  <PropertyRow label="Members">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex -space-x-1.5">
                        {project.members.slice(0, 5).map((m) => (
                          <Avatar key={m.id} name={m.name} src={m.avatarUrl} size="sm" className="ring-1 ring-bg" />
                        ))}
                      </span>
                      <span className="text-fg-muted">{project.members.length}</span>
                    </span>
                  </PropertyRow>
                )}
                <PropertyRow label="Issues">
                  <span className="inline-flex items-center gap-1.5 text-fg-muted">
                    <Hash className="h-3.5 w-3.5" />
                    {total}
                  </span>
                </PropertyRow>
                {(project.startDate || project.targetDate) && (
                  <PropertyRow label="Dates">
                    <span className="inline-flex items-center gap-1.5 text-fg-muted">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmt(project.startDate) || "—"} → {fmt(project.targetDate) || "—"}
                    </span>
                  </PropertyRow>
                )}
                {team && (
                  <PropertyRow label="Team">
                    <span className="inline-flex items-center gap-1.5 text-fg-muted">
                      <Users className="h-3.5 w-3.5" />
                      {team.name}
                    </span>
                  </PropertyRow>
                )}
                {project.labels?.length > 0 && (
                  <PropertyRow label="Labels">
                    <span className="flex flex-wrap gap-1.5">
                      {project.labels.map((l) => (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[11px] text-fg-muted"
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                          {l.name}
                        </span>
                      ))}
                    </span>
                  </PropertyRow>
                )}
              </div>

              <div className="mt-5 border-t border-glass-border pt-4">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  Progress
                </h2>
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-fg-muted">
                    <span className="h-2 w-2 rounded-full bg-surface-hover ring-1 ring-border" />
                    Scope <span className="font-medium text-fg">{total}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-fg-muted">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    Started <span className="font-medium text-fg">{started}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-fg-muted">
                    <span className="h-2 w-2 rounded-full bg-brand" />
                    Done <span className="font-medium text-fg">{completed}</span>
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div className="bg-brand transition-all" style={{ width: `${pct(completed)}%` }} />
                  <div className="bg-warning transition-all" style={{ width: `${pct(started)}%` }} />
                </div>
                <p className="mt-2 text-right text-xs text-fg-subtle">
                  {pct(completed)}% complete
                </p>
              </div>

              {project.milestones?.length > 0 && (
                <div className="mt-5 border-t border-glass-border pt-4">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                    Milestones
                  </h2>
                  <ul className="flex flex-col gap-1.5">
                    {project.milestones.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between rounded-md border border-glass-border px-3 py-2 text-sm"
                      >
                        <span className="truncate text-fg">{m.name}</span>
                        {m.targetDate && (
                          <span className="shrink-0 text-xs text-fg-subtle">{fmt(m.targetDate)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        ) : null}
      </div>

      {onThisProject && team && (
        <ProjectFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={handleUpdate}
          initial={project}
          mode="edit"
          teamId={team.id}
          teamKey={team.key}
          workspaceId={team.workspaceId}
        />
      )}
    </div>
  );
}
