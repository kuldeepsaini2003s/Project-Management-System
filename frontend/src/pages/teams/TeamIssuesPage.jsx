import { useEffect, useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import IssueBoard from "../../components/issues/IssueBoard.jsx";
import IssueFormModal from "../../components/issues/IssueFormModal.jsx";
import { fetchTeam, fetchTeamMembers, fetchTeamLabels } from "../../redux/actions/teamActions.js";
import { fetchTeamProjects } from "../../redux/actions/projectActions.js";
import {
  fetchTeamIssues,
  createIssue,
  moveIssueStatus,
} from "../../redux/actions/issueActions.js";

export default function TeamIssuesPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [modal, setModal] = useState({ open: false, status: "TODO" });
  const [error, setError] = useState("");

  const team = useSelector((state) => state.team.current);
  const issues = useSelector((state) => state.issue.teamIssues);
  const labels = useSelector((state) => state.team.labels);
  const members = useSelector((state) => state.team.members);
  const projects = useSelector((state) => state.project.teamProjects);
  const loading = useSelector((state) => state.issue.loading);

  useEffect(() => {
    dispatch(fetchTeam(teamId)).catch(() => {});
    dispatch(fetchTeamIssues(teamId)).catch((e) => setError(e.message));
    dispatch(fetchTeamLabels(teamId)).catch(() => {});
    dispatch(fetchTeamProjects(teamId)).catch(() => {});
    dispatch(fetchTeamMembers(teamId)).catch(() => {});
  }, [dispatch, teamId]);

  const handleSubmit = (data) =>
    dispatch(createIssue(teamId, { ...data, projectId: data.projectId || null }));

  const moveStatus = (id, status) =>
    dispatch(moveIssueStatus(id, status)).catch(() => {});

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[team?.name || "Team", "Issues"]}
        onMenu={onMenu}
        actions={
          <Button className="!w-auto px-3" onClick={() => setModal({ open: true, status: "TODO" })}>
            <Plus className="h-4 w-4" />
            New issue
          </Button>
        }
      />

      <div className="glass min-h-0 flex-1 overflow-hidden rounded-lg p-3">
        <FormError message={error} />
        {loading && issues.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading issues…</p>
        ) : (
          <IssueBoard
            issues={issues}
            onCreate={(status) => setModal({ open: true, status })}
            onMoveStatus={moveStatus}
            onOpen={(issue) => navigate(`/issues/${issue.id}`)}
          />
        )}
      </div>

      {team && team.id === teamId && (
        <IssueFormModal
          open={modal.open}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onSubmit={handleSubmit}
          mode="create"
          teamId={team.id}
          teamKey={team.key}
          members={members}
          labels={labels}
          projects={projects}
          defaultStatus={modal.status}
        />
      )}
    </div>
  );
}
