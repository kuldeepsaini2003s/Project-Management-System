import { useDispatch } from "react-redux";
import IssueFormModal from "./IssueFormModal.jsx";
import { useTeams } from "../../context/TeamContext.jsx";
import { createIssue } from "../../redux/actions/issueActions.js";
import {
  useGetTeamMembersQuery,
  useGetWorkspaceLabelsQuery,
  useGetTeamProjectsQuery,
} from "../../redux/apiSlice.js";

// Global "new issue" — scoped to the first team (the common case).
export default function CreateIssueModal({ open, onClose }) {
  const { teams } = useTeams();
  const team = teams[0];
  const dispatch = useDispatch();

  const skip = { skip: !open || !team };
  const { data: members = [] } = useGetTeamMembersQuery(team?.id, skip);
  const { data: labels = [] } = useGetWorkspaceLabelsQuery(team?.workspaceId, {
    skip: !open || !team,
  });
  const { data: projects = [] } = useGetTeamProjectsQuery(team?.id, skip);

  if (!open || !team) return null;

  return (
    <IssueFormModal
      open={open}
      onClose={onClose}
      mode="create"
      teamId={team.id}
      teamKey={team.key}
      workspaceId={team.workspaceId}
      members={members}
      labels={labels}
      projects={projects}
      onSubmit={(data) => dispatch(createIssue(team.id, data))}
    />
  );
}
