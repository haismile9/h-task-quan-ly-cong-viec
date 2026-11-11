import { Draggable, Droppable } from "@hello-pangea/dnd";
import { AiOutlinePlus } from "react-icons/ai";
import type { Task, TaskStatus } from "../../types";
import TaskCard from "./TaskCard";
import { statusLabel } from "./taskMeta";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

/** Một cột (danh sách) trên bảng: nền xám nhạt, thẻ trắng, nút thêm thẻ ở cuối. */
const TaskColumn = ({ status, tasks, onTaskClick, onAddTask }: TaskColumnProps) => (
  <section className="w-[272px] shrink-0 max-h-full flex flex-col bg-base-200 rounded-xl shadow-sm">
    <header className="flex items-center justify-between px-3 pt-3 pb-2">
      <h3 className="font-semibold text-sm">{statusLabel[status]}</h3>
      <span className="text-xs text-base-content/60 bg-base-300 rounded-full px-2 py-0.5">{tasks.length}</span>
    </header>

    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex-1 overflow-y-auto column-scroll px-2 pb-1 min-h-[12px] rounded-lg transition-colors ${
            snapshot.isDraggingOver ? "bg-base-300/60" : ""
          }`}
        >
          {tasks.map((task, index) => (
            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
              {(drag, dragSnapshot) => (
                <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className="pb-2">
                  <TaskCard task={task} onClick={() => onTaskClick(task)} isDragging={dragSnapshot.isDragging} />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>

    <footer className="p-2 pt-0">
      <button
        className="btn btn-ghost btn-sm w-full justify-start font-normal text-base-content/70 hover:bg-base-300"
        onClick={() => onAddTask(status)}
      >
        <AiOutlinePlus /> Thêm thẻ
      </button>
    </footer>
  </section>
);

export default TaskColumn;
