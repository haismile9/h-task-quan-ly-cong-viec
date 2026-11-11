import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { AiOutlineCheckSquare, AiOutlineClockCircle } from "react-icons/ai";
import { useMyTasks } from "../hooks/useTasks";
import Page from "../components/ui/Page";
import EmptyState from "../components/ui/EmptyState";
import { deadlineChipClass, deadlineState, isDone, priorityColor, priorityLabel } from "../components/tasks/taskMeta";

type Filter = "all" | "open" | "done";
const FILTER_LABEL: Record<Filter, string> = { all: "Tất cả", open: "Chưa xong", done: "Hoàn thành" };
const matchFilter = (f: Filter, done: boolean) => f === "all" || (f === "done") === done;

const MyTasks = () => {
  const { data: tasks = [], isLoading } = useMyTasks();
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const list = tasks.filter((t) => matchFilter(filter, isDone(t)));
    // Việc chưa xong, hạn gần nhất lên trước
    return [...list].sort((a, b) => {
      if (isDone(a) !== isDone(b)) return isDone(a) ? 1 : -1;
      return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
    });
  }, [tasks, filter]);

  const count = (f: Filter) => tasks.filter((t) => matchFilter(f, isDone(t))).length;

  return (
    <Page title="Công việc của tôi" subtitle="Các nhiệm vụ được giao cho bạn ở mọi dự án.">
      <div role="tablist" className="tabs tabs-box w-fit mb-4">
        {(["all", "open", "done"] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            className={`tab ${filter === f ? "tab-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABEL[f]} ({count(f)})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-box" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<AiOutlineCheckSquare />} title="Không có công việc nào" />
      ) : (
        <ul className="bg-base-100 border border-base-300 rounded-box divide-y divide-base-300">
          {visible.map((task) => {
            const deadline = deadlineState(task);
            return (
              <li key={task.id}>
                <Link to={`/projects/${task.project_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition">
                  <span
                    className="w-1.5 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: priorityColor[task.priority] }}
                    title={`Độ ưu tiên: ${priorityLabel[task.priority]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isDone(task) ? "line-through text-base-content/50" : ""}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-base-content/60 truncate">
                      {task.project_name}
                      {task.list_name && <> · {task.list_name}</>}
                    </p>
                  </div>
                  {deadline && (
                    <span className={`hidden sm:inline-flex items-center gap-1 text-xs rounded px-1.5 py-0.5 ${deadlineChipClass[deadline]}`}>
                      <AiOutlineClockCircle />
                      {dayjs(task.deadline).format("DD/MM/YYYY")}
                    </span>
                  )}
                  {isDone(task) && <span className="badge badge-sm badge-success">Hoàn thành</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
};

export default MyTasks;
