import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Topbar from "../../components/layout/Topbar.jsx";
import FormError from "../../components/ui/FormError.jsx";
import IssueBoard from "../../components/issues/IssueBoard.jsx";
import { fetchMyIssues, reorderIssues } from "../../redux/actions/issueActions.js";

export default function MyIssuesPage() {
  const { onMenu } = useOutletContext() || {};
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const issues = useSelector((state) => state.issue.myIssues);
  const loading = useSelector((state) => state.issue.loading);
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(fetchMyIssues()).catch((e) => setError(e.message));
  }, [dispatch]);

  const handleReorder = (status, orderedIds) =>
    dispatch(reorderIssues("myIssues", status, orderedIds)).catch(() => {});

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar breadcrumb={["My Issues"]} onMenu={onMenu} />

      <div className="min-h-0 flex-1 overflow-hidden">
        <FormError message={error} />
        {loading ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading…</p>
        ) : issues.length === 0 ? (
          <p className="py-16 text-center text-sm text-fg-muted">
            You haven't created any issues yet.
          </p>
        ) : (
          <IssueBoard
            issues={issues}
            onReorder={handleReorder}
            onOpen={(issue) => navigate(`/issues/${issue.id}`)}
          />
        )}
      </div>
    </div>
  );
}
