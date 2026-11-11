import dayjs from "dayjs";
import { AiFillCheckCircle, AiOutlineAlignLeft, AiOutlineClockCircle } from "react-icons/ai";
import Avatar from "../ui/Avatar";
import type { Task } from "../../types";
import { deadlineChipClass, deadlineState, priorityColor, priorityLabel } from "./taskMeta";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
  /** Bật/tắt trạng thái hoàn thành (vòng tròn tick như Trello). */
  onToggleDone?: () => void;
}

/** Thẻ nhiệm vụ trắng trên bảng Kanban. */
const TaskCard = ({ task, onClick, isDragging, onToggleDone }: TaskCardProps) => {
  const isDone = task.status === "done";
  const deadline = deadlineState(task);
  const assignees = task.assigned_users ?? [];

  return (
    <div
      onClick={onClick}
      className={`group bg-base-100 rounded-lg px-3 py-2 cursor-pointer shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f] hover:ring-2 hover:ring-primary transition ${
        isDragging ? "rotate-2 shadow-lg ring-2 ring-primary" : ""
      }`}
    >
      <span
        className="block h-2 w-10 rounded-full mb-2"
        style={{ backgroundColor: priorityColor[task.priority] }}
        title={`Độ ưu tiên: ${priorityLabel[task.priority]}`}
      />

      <div className="flex items-start">
        {onToggleDone && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone();
            }}
            className={`shrink-0 overflow-hidden transition-all duration-150 flex items-center ${
              isDone
                ? "w-5 mr-1.5 opacity-100"
                : "w-0 opacity-0 group-hover:w-5 group-hover:mr-1.5 group-hover:opacity-100 focus-visible:w-5 focus-visible:mr-1.5 focus-visible:opacity-100"
            }`}
            aria-label={isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
            title={isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
          >
            {isDone ? (
              <AiFillCheckCircle size={18} className="text-success" />
            ) : (
              <span className="block w-[16px] h-[16px] m-px rounded-full border-2 border-base-content/50 hover:border-base-content" />
            )}
          </button>
        )}
        <p className={`text-sm break-words min-w-0 ${isDone ? "text-base-content/60" : ""}`}>{task.title}</p>
      </div>

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
