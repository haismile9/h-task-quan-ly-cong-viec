import { Draggable, Droppable } from "@hello-pangea/dnd";
import type { Task, TaskStatus } from "../../types";
import TaskCard from "./TaskCard";
import { statusDotClass, statusLabel } from "./taskMeta";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const TaskColumn = ({ status, tasks, onTaskClick }: TaskColumnProps) => (
  <Droppable droppableId={status}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`w-80 min-h-[500px] p-4 rounded-box flex-shrink-0 transition ${
          snapshot.isDraggingOver ? "bg-base-300" : "bg-base-200"
        }`}
      >
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className={`status ${statusDotClass[status]}`} />
          {statusLabel[status]}
          <span className="badge badge-sm badge-ghost">{tasks.length}</span>
        </h3>

        <div className="space-y-3">
          {tasks.map((task, index) => (
            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
              {(drag) => (
                <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}>
                  <TaskCard task={task} onClick={() => onTaskClick(task)} />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      </div>
    )}
  </Droppable>
);

export default TaskColumn;
