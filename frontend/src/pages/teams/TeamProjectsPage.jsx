import { useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import ProjectBoard from "../../components/projects/ProjectBoard.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import { fetchTeam } from "../../redux/actions/teamActions.js";
import {
  fetchTeamProjects,
  createProject,
  moveProjectStatus,
} from "../../redux/actions/projectActions.js";

export default function TeamProjectsPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const dispatch = useDispatch();
  const [modal, setModal] = useState({ open: false, status: "BACKLOG" });
  const [error, setError] = useState("");

  const team = useSelector((state) => state.team.current);
  const projects = useSelector((state) => state.project.teamProjects);
  const loading = useSelector((state) => state.project.loading);

  useEffect(() => {
    dispatch(fetchTeam(teamId)).catch(() => {});
    dispatch(fetchTeamProjects(teamId)).catch((e) => setError(e.message));
  }, [dispatch, teamId]);

  const handleCreate = (data) => dispatch(createProject(data.teamId, data));
  const moveStatus = (id, status) =>
    dispatch(moveProjectStatus(id, status)).catch(() => {});

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
        <FormError message={error} />
        {loading && projects.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading projects…</p>
        ) : (
          <ProjectBoard
            projects={projects}
            onCreate={(status) => setModal({ open: true, status })}
            onMoveStatus={moveStatus}
          />
        )}
      </div>

      {team && team.id === teamId && (
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
