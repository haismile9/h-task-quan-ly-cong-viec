import client from "./client";
import type { MyTask, Task, TaskPriority, TaskStatus } from "../types";

export interface TaskInput {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_user_ids?: number[];
}

export const tasksApi = {
  listByProject: (projectId: number) =>
    client.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`).then((r) => r.data.tasks),

  create: (projectId: number, input: TaskInput & { title: string }) =>
    client.post<Task>(`/projects/${projectId}/tasks`, input).then((r) => r.data),

  update: (id: number, input: TaskInput) => client.put<Task>(`/tasks/${id}`, input).then((r) => r.data),

  remove: (id: number) => client.delete(`/tasks/${id}`),

  mine: () => client.get<{ tasks: MyTask[] }>("/my-tasks").then((r) => r.data.tasks),
};
