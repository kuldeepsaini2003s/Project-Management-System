import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import ProjectBoard from "../../components/projects/ProjectBoard.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useTeams } from "../../context/TeamContext.jsx";
import {
  fetchWorkspaceProjects,
  createProject,
  moveProjectStatus,
} from "../../redux/actions/projectActions.js";

export default function WorkspaceProjectsPage() {
  const { onMenu } = useOutletContext() || {};
  const { current, currentId } = useWorkspace();
  const { teams } = useTeams();
  const dispatch = useDispatch();
  const [modal, setModal] = useState({ open: false, status: "BACKLOG" });
  const [error, setError] = useState("");

  const projects = useSelector((state) => state.project.workspaceProjects);
  const loading = useSelector((state) => state.project.loading);

  useEffect(() => {
    if (currentId) dispatch(fetchWorkspaceProjects(currentId)).catch((e) => setError(e.message));
  }, [dispatch, currentId]);

  const handleCreate = (data) => dispatch(createProject(data.teamId, data));
  const moveStatus = (id, status) =>
    dispatch(moveProjectStatus(id, status)).catch(() => {});

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
        <FormError message={error} />
        {loading && projects.length === 0 ? (
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
