import { useEffect, useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
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
  reorderProjects,
} from "../../redux/actions/projectActions.js";

export default function TeamProjectsPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const navigate = useNavigate();
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
  const handleReorder = (status, orderedIds) =>
    dispatch(reorderProjects("teamProjects", status, orderedIds)).catch(() => {});

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[{ label: team?.name || "Team", to: `/teams/${teamId}` }, "Projects"]}
        onMenu={onMenu}
        actions={
          <Button
            variant="ghost"
            aria-label="New project"
            title="New project"
            className="!w-auto p-2"
            onClick={() => setModal({ open: true, status: "BACKLOG" })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <FormError message={error} />
        {loading && projects.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading projects…</p>
        ) : (
          <ProjectBoard
            projects={projects}
            onCreate={(status) => setModal({ open: true, status })}
            onReorder={handleReorder}
            onOpen={(project) => navigate(`/projects/${project.id}`)}
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
