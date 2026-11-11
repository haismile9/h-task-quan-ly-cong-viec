import client from "./client";
import type { ActivityPage } from "../types";

const page = (url: string, before?: number) =>
  client.get<ActivityPage>(url, { params: before ? { before } : undefined }).then((r) => r.data);

export const activitiesApi = {
  mine: (before?: number) => page("/activities/me", before),
  forTask: (taskId: number, before?: number) => page(`/tasks/${taskId}/activities`, before),
  forProject: (projectId: number, before?: number) => page(`/projects/${projectId}/activities`, before),
};
