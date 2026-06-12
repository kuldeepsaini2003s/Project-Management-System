import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Plus, Box } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import ProjectCard from "../../components/projects/ProjectCard.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import {
  useGetTeamQuery,
  useGetTeamProjectsQuery,
  useCreateProjectMutation,
  errMsg,
} from "../../store/apiSlice.js";

export default function TeamProjectsPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const [createOpen, setCreateOpen] = useState(false);

  const { data: team } = useGetTeamQuery(teamId);
  const { data: projects = [], isLoading, error } = useGetTeamProjectsQuery(teamId);
  const [createProject] = useCreateProjectMutation();

  const handleCreate = (data) => createProject({ teamId, ...data }).unwrap();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[team?.name || "Team", "Projects"]}
        onMenu={onMenu}
        actions={
          <Button className="!w-auto px-3" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      <div className="glass min-h-0 flex-1 overflow-y-auto rounded-lg p-4 sm:p-6">
        <FormError message={error ? errMsg(error) : ""} />

        {isLoading ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading projects…</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover text-fg-muted">
              <Box className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-fg">No projects yet</h2>
            <p className="mt-1 max-w-xs text-sm text-fg-muted">
              Projects group related issues toward a shared goal.
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

      {team && (
        <ProjectFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          mode="create"
          teamId={team.id}
          teamKey={team.key}
          workspaceId={team.workspaceId}
        />
      )}
    </div>
  );
}
