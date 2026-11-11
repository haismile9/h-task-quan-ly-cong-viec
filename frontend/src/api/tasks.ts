import client from "./client";
import type { BoardData, MyTask, Task, TaskList, TaskPriority, TaskStatus } from "../types";

export interface TaskInput {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_user_ids?: number[];
}

export const tasksApi = {
  /** Cả bảng: các danh sách và các thẻ. */
  board: (projectId: number) =>
    client.get<BoardData>(`/projects/${projectId}/tasks`).then((r) => ({ lists: r.data.lists, tasks: r.data.tasks })),

  /** Tạo thẻ ở cuối danh sách (mặc định danh sách đầu tiên). */
  create: (projectId: number, input: TaskInput & { title: string; list_id?: number }) =>
    client.post<Task>(`/projects/${projectId}/tasks`, input).then((r) => r.data),

  update: (id: number, input: TaskInput) => client.put<Task>(`/tasks/${id}`, input).then((r) => r.data),

  /** Chuyển thẻ tới danh sách list_id ở vị trí position (0 = trên cùng). */
  move: (id: number, listId: number, position: number) =>
    client.put<Task>(`/tasks/${id}/move`, { list_id: listId, position }).then((r) => r.data),

  remove: (id: number) => client.delete(`/tasks/${id}`),

  mine: () => client.get<{ tasks: MyTask[] }>("/my-tasks").then((r) => r.data.tasks),
};

export const listsApi = {
  create: (projectId: number, name: string) =>
    client.post<TaskList>(`/projects/${projectId}/lists`, { name }).then((r) => r.data),

  rename: (id: number, name: string) => client.put<TaskList>(`/lists/${id}`, { name }).then((r) => r.data),

  remove: (id: number) => client.delete(`/lists/${id}`),

  reorder: (projectId: number, ids: number[]) =>
    client.put<TaskList[]>(`/projects/${projectId}/lists/reorder`, { ids }).then((r) => r.data),
};
