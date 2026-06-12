import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Pencil, Trash2, Calendar } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import ProjectStatusBadge from "../../components/projects/ProjectStatusBadge.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import { projectService } from "../../services/projectService.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};
  const { current } = useWorkspace();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProject(await projectService.get(projectId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (data) => {
    setProject(await projectService.update(projectId, data));
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await projectService.remove(projectId);
      navigate("/projects", { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[current?.name || "Workspace", "Projects", project?.name || "…"]}
        onMenu={onMenu}
        actions={
          project && (
            <>
              <Button
                variant="secondary"
                className="!w-auto px-2.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="secondary"
                className="!w-auto px-2.5"
                onClick={handleDelete}
                isLoading={deleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )
        }
      />

      <div className="glass min-h-0 flex-1 overflow-y-auto rounded-lg p-6">
        <FormError message={error} />

        {loading ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading…</p>
        ) : project ? (
          <div className="mx-auto max-w-2xl">
            <div className="flex items-start gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
                style={{ backgroundColor: (project.color || "#5e6ad2") + "22" }}
              >
                {project.icon || "📦"}
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-fg">
                  {project.name}
                </h1>
                <div className="mt-2">
                  <ProjectStatusBadge status={project.status} />
                </div>
              </div>
            </div>

            {project.description && (
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                {project.description}
              </p>
            )}

            <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-glass-border sm:grid-cols-2">
              <Detail label="Status">
                <ProjectStatusBadge status={project.status} />
              </Detail>
              <Detail label="Target date">
                {project.targetDate ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-fg">
                    <Calendar className="h-3.5 w-3.5 text-fg-subtle" />
                    {formatDate(project.targetDate)}
                  </span>
                ) : (
                  <span className="text-sm text-fg-subtle">No target date</span>
                )}
              </Detail>
              <Detail label="Lead">
                {project.lead ? (
                  <span className="inline-flex items-center gap-2 text-sm text-fg">
                    <Avatar name={project.lead.name} src={project.lead.avatarUrl} size="sm" />
                    {project.lead.name}
                  </span>
                ) : (
                  <span className="text-sm text-fg-subtle">Unassigned</span>
                )}
              </Detail>
              <Detail label="Created">
                <span className="text-sm text-fg">{formatDate(project.createdAt)}</span>
              </Detail>
            </div>
          </div>
        ) : null}
      </div>

      {project && (
        <ProjectFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={handleUpdate}
          initial={project}
          mode="edit"
        />
      )}
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div className="bg-surface/40 p-4">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-subtle">
        {label}
      </p>
      {children}
    </div>
  );
}
