import dayjs from "dayjs";
import { AiOutlineClockCircle, AiOutlineWarning } from "react-icons/ai";
import type { Task } from "../../types";

/** Huy hiệu "Quá hạn" / "Sắp đến hạn" (≤ 2 ngày) cho task chưa xong. */
const DeadlineBadge = ({ task }: { task: Pick<Task, "deadline" | "status"> }) => {
  if (!task.deadline || task.status === "done") return null;

  const today = dayjs().startOf("day");
  const deadline = dayjs(task.deadline).startOf("day");

  if (deadline.isBefore(today)) {
    return (
      <span className="badge badge-error badge-sm gap-1">
        <AiOutlineWarning /> Quá hạn
      </span>
    );
  }
  if (deadline.diff(today, "day") <= 2) {
    return (
      <span className="badge badge-warning badge-sm gap-1">
        <AiOutlineClockCircle /> Sắp đến hạn
      </span>
    );
  }
  return null;
};

export default DeadlineBadge;
