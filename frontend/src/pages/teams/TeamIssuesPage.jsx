import { useEffect, useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import IssueBoard from "../../components/issues/IssueBoard.jsx";
import IssueFormModal from "../../components/issues/IssueFormModal.jsx";
import { fetchTeam, fetchTeamMembers } from "../../redux/actions/teamActions.js";
import { fetchWorkspaceLabels } from "../../redux/actions/workspaceActions.js";
import { fetchTeamProjects } from "../../redux/actions/projectActions.js";
import {
  fetchTeamIssues,
  createIssue,
  reorderIssues,
} from "../../redux/actions/issueActions.js";
import { Skeleton } from "../../components/ui/Skeleton.jsx";

export default function TeamIssuesPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [modal, setModal] = useState({ open: false, status: "TODO" });
  const [error, setError] = useState("");

  const team = useSelector((state) => state.team.current);
  const workspaceId = useSelector((state) => state.ui.currentWorkspaceId);
  const issues = useSelector((state) => state.issue.teamIssues);
  const labels = useSelector((state) => state.workspace.labels);
  const members = useSelector((state) => state.team.members);
  const projects = useSelector((state) => state.project.teamProjects);
  const loading = useSelector((state) => state.issue.loading);

  useEffect(() => {
    dispatch(fetchTeam(teamId)).catch(() => {});
    dispatch(fetchTeamIssues(teamId)).catch((e) => setError(e.message));
    dispatch(fetchTeamProjects(teamId)).catch(() => {});
    dispatch(fetchTeamMembers(teamId)).catch(() => {});
  }, [dispatch, teamId]);

  useEffect(() => {
    if (workspaceId) dispatch(fetchWorkspaceLabels(workspaceId)).catch(() => {});
  }, [dispatch, workspaceId]);

  const handleSubmit = (data) =>
    dispatch(createIssue(teamId, { ...data, projectId: data.projectId || null }));

  const handleReorder = (status, orderedIds) =>
    dispatch(reorderIssues("teamIssues", status, orderedIds)).catch(() => {});

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[{ label: team?.name || "Team", to: `/teams/${teamId}` }, "Issues"]}
        onMenu={onMenu}
        actions={
          <Button
            variant="ghost"
            aria-label="New issue"
            title="New issue"
            className="!w-auto p-2"
            onClick={() => setModal({ open: true, status: "TODO" })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <FormError message={error} />
        <Skeleton name="issue-board" loading={loading && issues.length === 0}>
          <IssueBoard
            issues={issues}
            onCreate={(status) => setModal({ open: true, status })}
            onReorder={handleReorder}
            onOpen={(issue) => navigate(`/issues/${issue.id}`)}
          />
        </Skeleton>
      </div>

      {team && team.id === teamId && (
        <IssueFormModal
          open={modal.open}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onSubmit={handleSubmit}
          mode="create"
          teamId={team.id}
          teamKey={team.key}
          workspaceId={team.workspaceId}
          members={members}
          labels={labels}
          projects={projects}
          defaultStatus={modal.status}
        />
      )}
    </div>
  );
}
