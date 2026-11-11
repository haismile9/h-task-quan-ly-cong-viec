import dayjs from "dayjs";
import { AiOutlineAlignLeft, AiOutlineClockCircle } from "react-icons/ai";
import Avatar from "../ui/Avatar";
import type { Task } from "../../types";
import { deadlineChipClass, deadlineState, priorityColor, priorityLabel } from "./taskMeta";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

/** Thẻ nhiệm vụ trắng trên bảng Kanban. */
const TaskCard = ({ task, onClick, isDragging }: TaskCardProps) => {
  const deadline = deadlineState(task);
  const assignees = task.assigned_users ?? [];

  return (
    <div
      onClick={onClick}
      className={`bg-base-100 rounded-lg px-3 py-2 cursor-pointer shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f] hover:ring-2 hover:ring-primary transition ${
        isDragging ? "rotate-2 shadow-lg ring-2 ring-primary" : ""
      }`}
    >
      <span
        className="block h-2 w-10 rounded-full mb-2"
        style={{ backgroundColor: priorityColor[task.priority] }}
        title={`Độ ưu tiên: ${priorityLabel[task.priority]}`}
      />

      <p className={`text-sm break-words ${task.status === "done" ? "line-through text-base-content/60" : ""}`}>
        {task.title}
      </p>

      {(deadline || task.description || assignees.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
          {deadline && (
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${deadlineChipClass[deadline]}`}
              title={deadline === "overdue" ? "Quá hạn" : deadline === "soon" ? "Sắp đến hạn" : "Hạn chót"}
            >
              <AiOutlineClockCircle />
              {dayjs(task.deadline).format("DD/MM")}
            </span>
          )}
          {task.description && (
            <AiOutlineAlignLeft className="text-base-content/60" title="Có mô tả" />
          )}
          {assignees.length > 0 && (
            <div className="ml-auto flex -space-x-1.5">
              {assignees.slice(0, 3).map((u) => (
                <Avatar key={u.id} name={u.name} size="xs" className="ring-2 ring-base-100" />
              ))}
              {assignees.length > 3 && (
                <span className="w-6 h-6 rounded-full bg-base-300 text-[10px] font-semibold inline-flex items-center justify-center ring-2 ring-base-100">
                  +{assignees.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
