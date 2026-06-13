import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import ProjectBoard from "../../components/projects/ProjectBoard.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import {
  useGetTeamQuery,
  useGetTeamProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  errMsg,
} from "../../redux/apiSlice.js";

export default function TeamProjectsPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const [modal, setModal] = useState({ open: false, status: "BACKLOG" });

  const { data: team } = useGetTeamQuery(teamId);
  const { data: projects = [], isLoading, error } = useGetTeamProjectsQuery(teamId);
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  const handleCreate = (data) => createProject({ ...data }).unwrap();
  const moveStatus = (id, status) =>
    updateProject({ id, teamId, status }).unwrap().catch(() => {});

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[team?.name || "Team", "Projects"]}
        onMenu={onMenu}
        actions={
          <Button className="!w-auto px-3" onClick={() => setModal({ open: true, status: "BACKLOG" })}>
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
            onCreate={(status) => setModal({ open: true, status })}
            onMoveStatus={moveStatus}
          />
        )}
      </div>

      {team && (
        <ProjectFormModal
          open={modal.open}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onSubmit={handleCreate}
          mode="create"
          teamId={team.id}
          teamKey={team.key}
          workspaceId={team.workspaceId}
          defaultStatus={modal.status}
        />
      )}
    </div>
  );
}
