import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import IssueDetailView from "../../components/issues/IssueDetailView.jsx";
import { useGetIssueQuery, useDeleteIssueMutation } from "../../redux/apiSlice.js";

export default function IssueDetailPage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};

  const { data: issue } = useGetIssueQuery(issueId, { skip: !issueId });
  const [deleteIssueMut] = useDeleteIssueMutation();
  const teamId = issue?.teamId;

  const handleDelete = async () => {
    if (!window.confirm("Delete this issue?")) return;
    await deleteIssueMut({ id: issueId, teamId, projectId: issue?.project?.id || null }).unwrap();
    navigate(`/teams/${teamId}/issues`, { replace: true });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[
          { label: issue?.teamName || "Team", to: teamId ? `/teams/${teamId}` : undefined },
          { label: "Issues", to: teamId ? `/teams/${teamId}/issues` : undefined },
          issue ? `${issue.identifier} ${issue.title}` : "…",
        ]}
        onMenu={onMenu}
        actions={
          issue && (
            <Button variant="secondary" className="!w-auto px-2.5" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )
        }
      />

      <div className="glass min-h-0 flex-1 overflow-hidden rounded-lg">
        <IssueDetailView issueId={issueId} />
      </div>
    </div>
  );
}
