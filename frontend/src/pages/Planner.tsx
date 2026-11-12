import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/vi";
import { AiFillCheckCircle, AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { useMyTasks } from "../hooks/useTasks";
import Page from "../components/ui/Page";
import { deadlineState, isDone, priorityColor } from "../components/tasks/taskMeta";
import type { MyTask } from "../types";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** 6 tuần (42 ô) bắt đầu từ thứ Hai của tuần chứa ngày 1 của tháng. */
const monthGrid = (month: Dayjs): Dayjs[] => {
  const first = month.startOf("month");
  const offset = (first.day() + 6) % 7; // thứ Hai = 0
  const start = first.subtract(offset, "day");
  return Array.from({ length: 42 }, (_, i) => start.add(i, "day"));
};

/** Thẻ nhỏ trong ô lịch: chấm ưu tiên + tên, gạch màu theo trạng thái hạn. */
const PlannerChip = ({ task }: { task: MyTask }) => {
  const state = deadlineState(task);
  const done = isDone(task);
  const tone =
    state === "overdue"
      ? "bg-error/15 text-error"
      : state === "soon"
        ? "bg-warning/25 text-warning-content"
        : done
          ? "bg-success/15 text-base-content/60"
          : "bg-base-200";
  return (
    <Link
      to={`/projects/${task.project_id}?card=${task.id}`}
      title={`${task.title} · ${task.project_name}`}
      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs truncate hover:ring-1 hover:ring-primary ${tone}`}
    >
      {done ? (
        <AiFillCheckCircle className="text-success shrink-0" />
      ) : (
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: priorityColor[task.priority] }} />
      )}
      <span className="truncate">{task.title}</span>
    </Link>
  );
};

/** Kế hoạch: lịch tháng các thẻ được giao cho tôi có hạn chót (như Planner của Trello). */
const Planner = () => {
  const { data: tasks = [], isLoading } = useMyTasks();
  const [month, setMonth] = useState(() => dayjs().startOf("month"));
  const today = dayjs().startOf("day");

  const byDay = useMemo(() => {
    const map = new Map<string, MyTask[]>();
    for (const t of tasks) {
      if (!t.deadline) continue;
      const key = t.deadline.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [tasks]);

  const withoutDeadline = tasks.filter((t) => !t.deadline && !isDone(t)).length;
  const days = monthGrid(month);

  return (
    <Page title="Kế hoạch" subtitle="Các thẻ được giao cho bạn, xếp theo hạn chót.">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold capitalize flex-1">{month.locale("vi").format("MMMM YYYY")}</h2>
        <button className="btn btn-sm" onClick={() => setMonth(dayjs().startOf("month"))}>
          Hôm nay
        </button>
        <button className="btn btn-sm btn-square" onClick={() => setMonth(month.subtract(1, "month"))} aria-label="Tháng trước">
          <AiOutlineLeft />
        </button>
        <button className="btn btn-sm btn-square" onClick={() => setMonth(month.add(1, "month"))} aria-label="Tháng sau">
          <AiOutlineRight />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <div className="rounded-box border border-base-300 overflow-hidden bg-base-100">
          <div className="grid grid-cols-7 bg-base-200 text-xs font-semibold text-base-content/70">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-1.5 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const items = byDay.get(d.format("YYYY-MM-DD")) ?? [];
              const inMonth = d.month() === month.month();
              const isToday = d.isSame(today, "day");
              return (
                <div
                  key={d.toString()}
                  className={`min-h-24 border-t border-l border-base-300 p-1 space-y-1 ${inMonth ? "" : "bg-base-200/50"}`}
                >
                  <div className="flex justify-end">
                    <span
                      className={`text-xs w-6 h-6 inline-flex items-center justify-center rounded-full ${
                        isToday ? "bg-primary text-primary-content font-bold" : inMonth ? "" : "text-base-content/40"
                      }`}
                    >
                      {d.date()}
                    </span>
                  </div>
                  {items.slice(0, 3).map((t) => (
                    <PlannerChip key={t.id} task={t} />
                  ))}
                  {items.length > 3 && (
                    <p className="text-[11px] text-base-content/60 px-1" title={items.slice(3).map((t) => t.title).join("\n")}>
                      +{items.length - 3} thẻ khác
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {withoutDeadline > 0 && (
        <p className="text-sm text-base-content/60 mt-3">
          Còn {withoutDeadline} thẻ chưa xong không có hạn chót —{" "}
          <Link to="/my-task" className="link link-primary">
            xem ở Công việc của tôi
          </Link>
          .
        </p>
      )}
    </Page>
  );
};

export default Planner;
