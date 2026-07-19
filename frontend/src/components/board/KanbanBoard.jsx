import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
  closestCenter,
  getFirstCollision,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";

const group = (items, statusOrder) => {
  const cols = {};
  statusOrder.forEach((s) => (cols[s] = []));
  items.forEach((it) => {
    (cols[it.status] ||= []).push(it);
  });
  return cols;
};

function SortableCard({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? "opacity-40" : ""}`}
    >
      {children}
    </div>
  );
}

function Column({ status, meta, items, onCreate, addLabel, renderCard, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const Icon = meta.icon;
  return (
    <div
      ref={setNodeRef}
      className={`glass flex w-[80vw] max-w-[18rem] shrink-0 flex-col rounded-xl p-1.5 transition-shadow sm:w-72 ${
        isOver ? "ring-2 ring-brand/60" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-2 py-2">
        {Icon && <Icon className="h-4 w-4" style={{ color: meta.color }} />}
        <span className="text-sm font-medium text-fg">{meta.label}</span>
        <span className="rounded-full bg-surface-hover px-1.5 text-xs text-fg-subtle">
          {items.length}
        </span>
        {onCreate && (
          <button
            onClick={() => onCreate(status)}
            aria-label={`Add ${addLabel}`}
            title={`Add ${addLabel}`}
            className="ml-auto cursor-pointer rounded p-1 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-1 pb-2">
          {items.map((item) => (
            <SortableCard key={item.id} id={item.id}>
              {renderCard(item, { onOpen })}
            </SortableCard>
          ))}

          {items.length === 0 && (
            onCreate ? (
              <button
                onClick={() => onCreate(status)}
                className={`w-full rounded-lg border border-dashed py-6 text-center text-xs transition-colors focus:outline-none ${
                  isOver
                    ? "border-brand/60 bg-brand/5 text-fg-muted"
                    : "border-border text-fg-subtle hover:border-brand/50 hover:bg-brand/5 hover:text-fg-muted"
                }`}
              >
                {isOver ? "Drop here" : (
                  <span className="flex flex-col items-center gap-1.5">
                    <Plus className="h-4 w-4 opacity-50" />
                    <span>Add {addLabel}</span>
                  </span>
                )}
              </button>
            ) : (
              <div
                className={`rounded-lg border border-dashed py-6 text-center text-xs transition-colors ${
                  isOver ? "border-brand/60 bg-brand/5 text-fg-muted" : "border-border text-fg-subtle"
                }`}
              >
                {isOver ? "Drop here" : "Empty"}
              </div>
            )
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({
  items,
  statusOrder,
  statusMeta,
  renderCard,
  renderOverlay,
  onOpen,
  onCreate,
  onReorder,
  addLabel = "item",
}) {
  const [cols, setCols] = useState(() => group(items, statusOrder));
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (!activeId) setCols(group(items, statusOrder));
  }, [items, statusOrder, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findContainer = (id) => {
    if (id in cols) return id;
    return statusOrder.find((s) => cols[s]?.some((i) => i.id === id));
  };

  const collisionDetection = (args) => {
    const pointer = pointerWithin(args);
    const intersections = pointer.length ? pointer : rectIntersection(args);
    let overId = getFirstCollision(intersections, "id");
    if (overId == null) return [];

    if (overId in cols) {
      const ids = (cols[overId] || []).map((i) => i.id);
      if (ids.length) {
        const refined = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (c) => c.id !== overId && ids.includes(c.id)
          ),
        });
        if (refined.length) overId = refined[0].id;
      }
    }
    return [{ id: overId }];
  };

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    for (const s of statusOrder) {
      const found = cols[s]?.find((i) => i.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, cols, statusOrder]);

  const onDragStart = ({ active }) => setActiveId(active.id);

  const onDragOver = ({ active, over }) => {
    if (!over) return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to || from === to) return;

    setCols((prev) => {
      const fromItems = prev[from];
      const toItems = prev[to];
      const moving = fromItems.find((i) => i.id === active.id);
      if (!moving) return prev;

      let newIndex;
      if (over.id in prev) {
        newIndex = toItems.length;
      } else {
        const overIndex = toItems.findIndex((i) => i.id === over.id);
        newIndex = overIndex >= 0 ? overIndex : toItems.length;
      }

      return {
        ...prev,
        [from]: fromItems.filter((i) => i.id !== active.id),
        [to]: [
          ...toItems.slice(0, newIndex),
          { ...moving, status: to },
          ...toItems.slice(newIndex),
        ],
      };
    });
  };

  const onDragEnd = ({ active, over }) => {
    const from = findContainer(active.id);
    const to = over ? findContainer(over.id) : from;
    if (!from || !to) {
      setActiveId(null);
      return;
    }

    let finalCols = cols;
    if (from === to && !(over?.id in cols)) {
      const items_ = cols[to];
      const oldIndex = items_.findIndex((i) => i.id === active.id);
      const newIndex = items_.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        finalCols = { ...cols, [to]: arrayMove(items_, oldIndex, newIndex) };
        setCols(finalCols);
      }
    }

    const orderedIds = (finalCols[to] || []).map((i) => i.id);
    setActiveId(null);
    if (orderedIds.length) onReorder?.(to, orderedIds);
  };

  const onDragCancel = () => {
    setActiveId(null);
    setCols(group(items, statusOrder));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex h-full gap-4 overflow-x-auto px-1 pb-1">
        {statusOrder.map((status) => (
          <Column
            key={status}
            status={status}
            meta={statusMeta[status]}
            items={cols[status] || []}
            onCreate={onCreate}
            addLabel={addLabel}
            renderCard={renderCard}
            onOpen={onOpen}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (renderOverlay || renderCard)(activeItem, { onOpen, dragging: true }) : null}
      </DragOverlay>
    </DndContext>
  );
}
