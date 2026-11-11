import dayjs from "dayjs";
import type { Task } from "../../types";
import DeadlineBadge from "./DeadlineBadge";
import { priorityBadgeClass, priorityLabel, statusDotClass } from "./taskMeta";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const TaskCard = ({ task, onClick }: TaskCardProps) => (
  <div
    onClick={onClick}
    className="card card-sm bg-base-100 shadow-sm hover:shadow-md hover:bg-base-300 transition cursor-pointer"
  >
    <div className="card-body gap-2">
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-semibold leading-snug">{task.title}</h4>
        <span className={`status ${statusDotClass[task.status]} mt-1.5 shrink-0`} />
      </div>

      {task.description && (
        <p className="text-sm text-base-content/70 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1">
        <span className={`badge badge-sm ${priorityBadgeClass[task.priority]}`}>
          {priorityLabel[task.priority]}
        </span>
        {task.deadline && (
          <span className="badge badge-sm badge-outline">{dayjs(task.deadline).format("DD/MM")}</span>
        )}
        <DeadlineBadge task={task} />
      </div>

      <p className="text-xs text-base-content/60">
        {task.assigned_users?.length ? (
          <>👤 {task.assigned_users.map((u) => u.name).join(", ")}</>
        ) : (
          <span className="italic">Chưa được gán</span>
        )}
      </p>
    </div>
  </div>
);

export default TaskCard;
