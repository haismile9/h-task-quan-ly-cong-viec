import client from "./client";
import type { Project } from "../types";

export interface ProjectInput {
  name: string;
  description?: string;
  background_url?: string;
  collaborator_email?: string;
}

export const projectsApi = {
  list: () => client.get<Project[]>("/projects").then((r) => r.data),

  get: (id: number) => client.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (input: ProjectInput) => client.post<Project>("/projects", input).then((r) => r.data),

  update: (id: number, input: Omit<ProjectInput, "collaborator_email">) =>
    client.put<Project>(`/projects/${id}`, input).then((r) => r.data),

  remove: (id: number) => client.delete(`/projects/${id}`),

  addMember: (id: number, email: string) => client.post(`/projects/${id}/members`, { email }),
};
