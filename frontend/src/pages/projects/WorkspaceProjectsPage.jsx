import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import ProjectBoard from "../../components/projects/ProjectBoard.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useTeams } from "../../context/TeamContext.jsx";
import {
  useGetWorkspaceProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  errMsg,
} from "../../redux/apiSlice.js";

export default function WorkspaceProjectsPage() {
  const { onMenu } = useOutletContext() || {};
  const { current, currentId } = useWorkspace();
  const { teams } = useTeams();
  const [modal, setModal] = useState({ open: false, status: "BACKLOG" });

  const { data: projects = [], isLoading, error } = useGetWorkspaceProjectsQuery(currentId, {
    skip: !currentId,
  });
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  const handleCreate = (data) => createProject({ ...data }).unwrap();

  const moveStatus = (id, status) => {
    const project = projects.find((p) => p.id === id);
    updateProject({ id, teamId: project?.teamId, status }).unwrap().catch(() => {});
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[current?.name || "Workspace", "Projects"]}
        onMenu={onMenu}
        actions={
          <Button
            className="!w-auto px-3"
            onClick={() => setModal({ open: true, status: "BACKLOG" })}
            disabled={teams.length === 0}
          >
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      <div className="glass min-h-0 flex-1 overflow-hidden rounded-lg p-3">
        <FormError message={error ? errMsg(error) : ""} />
        {isLoading ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading projects…</p>
        ) : (
          <ProjectBoard
            projects={projects}
            onCreate={teams.length ? (status) => setModal({ open: true, status }) : undefined}
            onMoveStatus={moveStatus}
          />
        )}
      </div>

      <ProjectFormModal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSubmit={handleCreate}
        mode="create"
        teams={teams}
        defaultStatus={modal.status}
      />
    </div>
  );
}
