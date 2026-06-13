import { useOutletContext, useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar.jsx";
import FormError from "../../components/ui/FormError.jsx";
import IssueBoard from "../../components/issues/IssueBoard.jsx";
import { useGetMyIssuesQuery, useUpdateIssueMutation, errMsg } from "../../store/apiSlice.js";

export default function MyIssuesPage() {
  const { onMenu } = useOutletContext() || {};
  const navigate = useNavigate();

  const { data: issues = [], isLoading, error } = useGetMyIssuesQuery();
  const [updateIssue] = useUpdateIssueMutation();

  const moveStatus = (id, status) => {
    const issue = issues.find((i) => i.id === id);
    updateIssue({ id, teamId: issue?.teamId, projectId: issue?.projectId, status })
      .unwrap()
      .catch(() => {});
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar breadcrumb={["My Issues"]} onMenu={onMenu} />

      <div className="glass min-h-0 flex-1 overflow-hidden rounded-lg p-3">
        <FormError message={error ? errMsg(error) : ""} />
        {isLoading ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading…</p>
        ) : issues.length === 0 ? (
          <p className="py-16 text-center text-sm text-fg-muted">
            You haven't created any issues yet.
          </p>
        ) : (
          <IssueBoard
            issues={issues}
            onMoveStatus={moveStatus}
            onOpen={(issue) => navigate(`/issues/${issue.id}`)}
          />
        )}
      </div>
    </div>
  );
}
