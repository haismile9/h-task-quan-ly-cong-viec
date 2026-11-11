import dayjs from "dayjs";
import type { Task, TaskPriority, TaskStatus } from "../../types";

/** Thứ tự cột trên bảng Kanban. */
export const TASK_STATUSES: TaskStatus[] = ["pending", "in_progress", "done"];

export const statusLabel: Record<TaskStatus, string> = {
  pending: "Chờ làm",
  in_progress: "Đang làm",
  done: "Hoàn thành",
};

/** Badge trạng thái (dùng ở danh sách, không phải trên bảng). */
export const statusBadgeClass: Record<TaskStatus, string> = {
  pending: "badge-ghost",
  in_progress: "badge-info",
  done: "badge-success",
};

export const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

export const priorityLabel: Record<TaskPriority, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

/** Màu nhãn độ ưu tiên trên thẻ (thanh màu nhỏ phía trên tiêu đề). */
export const priorityColor: Record<TaskPriority, string> = {
  low: "#4bce97",
  medium: "#579dff",
  high: "#f87168",
};

export type DeadlineState = "done" | "overdue" | "soon" | "normal";

/** Tình trạng hạn chót: quá hạn, sắp đến hạn (≤ 2 ngày), đã xong, bình thường. */
export const deadlineState = (task: Pick<Task, "deadline" | "status">): DeadlineState | null => {
  if (!task.deadline) return null;
  if (task.status === "done") return "done";
  const today = dayjs().startOf("day");
  const deadline = dayjs(task.deadline).startOf("day");
  if (deadline.isBefore(today)) return "overdue";
  if (deadline.diff(today, "day") <= 2) return "soon";
  return "normal";
};

export const deadlineChipClass: Record<DeadlineState, string> = {
  done: "bg-success text-success-content",
  overdue: "bg-error text-error-content",
  soon: "bg-warning text-warning-content",
  normal: "bg-transparent text-base-content/70",
};
