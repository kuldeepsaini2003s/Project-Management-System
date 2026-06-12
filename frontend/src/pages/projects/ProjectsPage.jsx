import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Box } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import ProjectCard from "../../components/projects/ProjectCard.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { projectService } from "../../services/projectService.js";

export default function ProjectsPage() {
  const { onMenu } = useOutletContext() || {};
  const { current, currentId } = useWorkspace();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    if (!currentId) return;
    setLoading(true);
    setError("");
    try {
      setProjects(await projectService.listForWorkspace(currentId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (data) => {
    const project = await projectService.create(currentId, data);
    setProjects((prev) => [project, ...prev]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[current?.name || "Workspace", "Projects"]}
        onMenu={onMenu}
        actions={
          <Button className="!w-auto px-3" size="md" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      <div className="glass min-h-0 flex-1 overflow-y-auto rounded-lg p-4 sm:p-6">
        <FormError message={error} />

        {loading ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading projects…</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover text-fg-muted">
              <Box className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-fg">No projects yet</h2>
            <p className="mt-1 max-w-xs text-sm text-fg-muted">
              Projects group related issues and a shared goal. Create your first one.
            </p>
            <div className="mt-4">
              <Button className="!w-auto px-4" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                New project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />
    </div>
  );
}
