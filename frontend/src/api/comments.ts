import client from "./client";
import type { Comment } from "../types";

export const commentsApi = {
  list: (taskId: number) => client.get<Comment[]>(`/tasks/${taskId}/comments`).then((r) => r.data),

  create: (taskId: number, content: string) =>
    client.post<Comment>(`/tasks/${taskId}/comments`, { content }).then((r) => r.data),

  remove: (id: number) => client.delete(`/comments/${id}`),
};
