import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Pencil, Trash2, Plus, Calendar } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import ProjectStatusBadge from "../../components/projects/ProjectStatusBadge.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import IssueBoard from "../../components/issues/IssueBoard.jsx";
import IssueFormModal from "../../components/issues/IssueFormModal.jsx";
import { PRIORITIES } from "../../constants/priority.js";
import { fetchTeam, fetchTeamLabels, fetchTeamMembers } from "../../redux/actions/teamActions.js";
import { fetchProject, updateProject, deleteProject } from "../../redux/actions/projectActions.js";
import {
  fetchProjectIssues,
  createIssue,
  moveIssueStatus,
} from "../../redux/actions/issueActions.js";

const fmt = (v) =>
  v ? new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};
  const dispatch = useDispatch();

  const [tab, setTab] = useState("issues");
  const [editOpen, setEditOpen] = useState(false);
  const [issueModal, setIssueModal] = useState({ open: false, status: "TODO" });
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const project = useSelector((state) => state.project.current);
  const team = useSelector((state) => state.team.current);
  const issues = useSelector((state) => state.issue.projectIssues);
  const labels = useSelector((state) => state.team.labels);
  const members = useSelector((state) => state.team.members);
  const loading = useSelector((state) => state.project.loading);

  useEffect(() => {
    setError("");
    dispatch(fetchProject(projectId))
      .then((p) => {
        if (p?.teamId) {
          dispatch(fetchTeam(p.teamId)).catch(() => {});
          dispatch(fetchTeamLabels(p.teamId)).catch(() => {});
          dispatch(fetchTeamMembers(p.teamId)).catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
    dispatch(fetchProjectIssues(projectId)).catch(() => {});
  }, [dispatch, projectId]);

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

  const submitIssue = (data) => dispatch(createIssue(teamId, { ...data, projectId }));
  const moveStatus = (id, status) => dispatch(moveIssueStatus(id, status)).catch(() => {});

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[team?.name || "Team", "Projects", project?.name || "…"]}
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

      <div className="glass min-h-0 flex-1 overflow-hidden rounded-lg">
        <FormError message={error} />
        {loading && !onThisProject ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading…</p>
        ) : onThisProject ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-glass-border p-5">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: (project.color || "#5e6ad2") + "22" }}
                >
                  {project.icon || "📦"}
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-semibold tracking-tight text-fg">{project.name}</h1>
                  {project.summary && <p className="mt-0.5 text-sm text-fg-muted">{project.summary}</p>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fg-muted">
                <ProjectStatusBadge status={project.status} />
                {priority && priority.label !== "No priority" && (
                  <span className="inline-flex items-center gap-1.5">
                    <priority.icon className="h-3.5 w-3.5" style={{ color: priority.color }} />
                    {priority.label}
                  </span>
                )}
                {project.lead && (
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar name={project.lead.name} src={project.lead.avatarUrl} size="sm" />
                    {project.lead.name}
                  </span>
                )}
                {project.targetDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {fmt(project.targetDate)}
                  </span>
                )}
                {project.members?.length > 0 && (
                  <span className="flex -space-x-1.5">
                    {project.members.slice(0, 5).map((m) => (
                      <Avatar key={m.id} name={m.name} src={m.avatarUrl} size="sm" className="ring-1 ring-bg" />
                    ))}
                  </span>
                )}
                {project.labels?.map((l) => (
                  <span key={l.id} className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.name}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex gap-1">
                {["issues", "overview"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
                      tab === t ? "bg-surface-hover font-medium text-fg" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-3">
              {tab === "issues" ? (
                <div className="flex h-full flex-col gap-2">
                  <div className="flex justify-end">
                    <Button className="!w-auto px-3" onClick={() => setIssueModal({ open: true, status: "TODO" })}>
                      <Plus className="h-4 w-4" />
                      New issue
                    </Button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <IssueBoard
                      issues={issues}
                      showProject={false}
                      onCreate={(status) => setIssueModal({ open: true, status })}
                      onMoveStatus={moveStatus}
                      onOpen={(issue) => navigate(`/issues/${issue.id}`)}
                    />
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-2xl overflow-y-auto p-3">
                  {project.description ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-sm text-fg-subtle">No description yet.</p>
                  )}
                  {project.milestones?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-2 text-sm font-semibold text-fg">Milestones</h3>
                      <ul className="flex flex-col gap-1.5">
                        {project.milestones.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-center justify-between rounded-md border border-glass-border px-3 py-2 text-sm"
                          >
                            <span className="text-fg">{m.name}</span>
                            {m.targetDate && <span className="text-xs text-fg-subtle">{fmt(m.targetDate)}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {onThisProject && team && (
        <>
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
          <IssueFormModal
            open={issueModal.open}
            onClose={() => setIssueModal((m) => ({ ...m, open: false }))}
            onSubmit={submitIssue}
            mode="create"
            teamId={team.id}
            teamKey={team.key}
            members={members}
            labels={labels}
            lockedProjectId={projectId}
            defaultStatus={issueModal.status}
          />
        </>
      )}
    </div>
  );
}
