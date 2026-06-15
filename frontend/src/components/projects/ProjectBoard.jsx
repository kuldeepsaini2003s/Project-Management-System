import KanbanBoard from "../board/KanbanBoard.jsx";
import ProjectBoardCard from "./ProjectBoardCard.jsx";
import { PROJECT_STATUSES, STATUS_ORDER } from "../../constants/projectStatus.js";

export default function ProjectBoard({ projects, onCreate, onReorder, onOpen }) {
  return (
    <KanbanBoard
      items={projects}
      statusOrder={STATUS_ORDER}
      statusMeta={PROJECT_STATUSES}
      addLabel="project"
      onCreate={onCreate}
      onReorder={onReorder}
      onOpen={onOpen}
      renderCard={(project, { onOpen: open, dragging }) => (
        <ProjectBoardCard project={project} onOpen={open} dragging={dragging} />
      )}
    />
  );
}
