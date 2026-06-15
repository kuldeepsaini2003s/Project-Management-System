import KanbanBoard from "../board/KanbanBoard.jsx";
import IssueCard from "./IssueCard.jsx";
import { ISSUE_STATUSES, ISSUE_STATUS_ORDER } from "../../constants/issueStatus.js";

export default function IssueBoard({ issues, onCreate, onReorder, onOpen, showProject = true }) {
  return (
    <KanbanBoard
      items={issues}
      statusOrder={ISSUE_STATUS_ORDER}
      statusMeta={ISSUE_STATUSES}
      addLabel="issue"
      onCreate={onCreate}
      onReorder={onReorder}
      onOpen={onOpen}
      renderCard={(issue, { onOpen: open, dragging }) => (
        <IssueCard issue={issue} onClick={open} showProject={showProject} dragging={dragging} />
      )}
    />
  );
}
