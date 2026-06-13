import { useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import IssueBoard from "../../components/issues/IssueBoard.jsx";
import IssueFormModal from "../../components/issues/IssueFormModal.jsx";
import {
  useGetTeamQuery,
  useGetTeamIssuesQuery,
  useGetTeamLabelsQuery,
  useGetTeamProjectsQuery,
  useGetTeamMembersQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  errMsg,
} from "../../redux/apiSlice.js";

export default function TeamIssuesPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};
  const navigate = useNavigate();

  const { data: team } = useGetTeamQuery(teamId);
  const { data: issues = [], isLoading, error } = useGetTeamIssuesQuery(teamId);
  const { data: labels = [] } = useGetTeamLabelsQuery(teamId);
  const { data: projects = [] } = useGetTeamProjectsQuery(teamId);
  const { data: members = [] } = useGetTeamMembersQuery(teamId);
  const [createIssue] = useCreateIssueMutation();
  const [updateIssue] = useUpdateIssueMutation();

  const [modal, setModal] = useState({ open: false, status: "TODO" });

  const handleSubmit = (data) =>
    createIssue({ teamId, ...data, projectId: data.projectId || null }).unwrap();

  const moveStatus = (id, status) =>
    updateIssue({ id, teamId, status }).unwrap().catch(() => {});

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
        <FormError message={error ? errMsg(error) : ""} />
        {isLoading ? (
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

      {team && (
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
