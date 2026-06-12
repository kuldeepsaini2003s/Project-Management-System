import { useCallback, useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/ui/FormError.jsx";
import IssueBoard from "../../components/issues/IssueBoard.jsx";
import IssueFormModal from "../../components/issues/IssueFormModal.jsx";
import { teamService } from "../../services/teamService.js";
import { issueService } from "../../services/issueService.js";

export default function TeamIssuesPage() {
  const { teamId } = useParams();
  const { onMenu } = useOutletContext() || {};

  const [team, setTeam] = useState(null);
  const [issues, setIssues] = useState([]);
  const [members, setMembers] = useState([]);
  const [labels, setLabels] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState({ open: false, initial: null, status: "TODO" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const t = await teamService.get(teamId);
      setTeam(t);
      const [iss, lbl, prj, mem] = await Promise.all([
        teamService.listIssues(teamId),
        teamService.listLabels(teamId),
        teamService.listProjects(teamId),
        teamService.listMembers(teamId),
      ]);
      setIssues(iss);
      setLabels(lbl);
      setProjects(prj);
      setMembers(mem);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (data) => {
    if (modal.initial) {
      const updated = await issueService.update(modal.initial.id, data);
      setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      const created = await teamService.createIssue(teamId, data);
      setIssues((prev) => [created, ...prev]);
    }
  };

  const moveStatus = async (id, status) => {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      await issueService.update(id, { status });
    } catch {
      load();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar
        breadcrumb={[team?.name || "Team", "Issues"]}
        onMenu={onMenu}
        actions={
          <Button
            className="!w-auto px-3"
            onClick={() => setModal({ open: true, initial: null, status: "TODO" })}
          >
            <Plus className="h-4 w-4" />
            New issue
          </Button>
        }
      />

      <div className="glass min-h-0 flex-1 overflow-hidden rounded-lg p-3">
        <FormError message={error} />
        {loading ? (
          <p className="py-10 text-center text-sm text-fg-muted">Loading issues…</p>
        ) : (
          <IssueBoard
            issues={issues}
            onCreate={(status) => setModal({ open: true, initial: null, status })}
            onMoveStatus={moveStatus}
            onOpen={(issue) => setModal({ open: true, initial: issue, status: issue.status })}
          />
        )}
      </div>

      {team && (
        <IssueFormModal
          open={modal.open}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onSubmit={handleSubmit}
          initial={modal.initial}
          mode={modal.initial ? "edit" : "create"}
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
