import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useMyTasks } from "../hooks/useTasks";
import type { TaskStatus } from "../types";

const statusStyle: Record<TaskStatus, string> = {
  pending: "badge badge-warning text-xs",
  in_progress: "badge badge-info text-xs",
  done: "badge badge-success text-xs",
};

const statusLabel: Record<TaskStatus, string> = {
  pending: "Chờ làm",
  in_progress: "Đang làm",
  done: "Hoàn thành",
};

const MyTasks = () => {
  const { data: tasks = [], isLoading } = useMyTasks();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📌 Công việc của tôi</h2>

      {isLoading ? (
        <div className="text-center">Đang tải...</div>
      ) : tasks.length === 0 ? (
        <div className="text-gray-400 italic">Không có công việc nào được giao.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <Link
              key={task.id}
              to={`/projects/${task.project_id}`}
              className="bg-base-200 p-4 rounded shadow hover:bg-base-300 transition block"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{task.title}</h3>
                <span className={statusStyle[task.status]}>{statusLabel[task.status]}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{task.description || "Không có mô tả"}</p>
              <p className="text-xs text-gray-400">
                📁 {task.project_name} · 🗓 Hạn:{" "}
                {task.deadline ? dayjs(task.deadline).format("DD/MM/YYYY") : "Không rõ"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
