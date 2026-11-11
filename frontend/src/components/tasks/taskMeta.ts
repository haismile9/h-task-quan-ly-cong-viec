import type { TaskPriority, TaskStatus } from "../../types";

/** Thứ tự cột trên bảng Kanban. */
export const TASK_STATUSES: TaskStatus[] = ["pending", "in_progress", "done"];

export const statusLabel: Record<TaskStatus, string> = {
  pending: "Chờ làm",
  in_progress: "Đang làm",
  done: "Hoàn thành",
};

/** Màu chấm trạng thái (daisyUI `status-*`). */
export const statusDotClass: Record<TaskStatus, string> = {
  pending: "status-warning",
  in_progress: "status-info",
  done: "status-success",
};

export const priorityLabel: Record<TaskPriority, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

export const priorityBadgeClass: Record<TaskPriority, string> = {
  low: "badge-ghost",
  medium: "badge-info",
  high: "badge-error",
};
