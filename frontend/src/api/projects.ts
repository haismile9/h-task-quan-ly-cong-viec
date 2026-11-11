import client from "./client";
import type { AddMemberResult, Project } from "../types";

export interface ProjectInput {
  name: string;
  description?: string;
  background_url?: string;
}

export const projectsApi = {
  list: () => client.get<Project[]>("/projects").then((r) => r.data),

  get: (id: number) => client.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (input: ProjectInput) => client.post<Project>("/projects", input).then((r) => r.data),

  update: (id: number, input: ProjectInput) =>
    client.put<Project>(`/projects/${id}`, input).then((r) => r.data),

  remove: (id: number) => client.delete(`/projects/${id}`),

  /** Thêm thành viên; email chưa có tài khoản sẽ nhận lời mời qua mail. */
  addMember: (id: number, email: string) =>
    client.post<AddMemberResult>(`/projects/${id}/members`, { email }).then((r) => r.data),

  cancelInvitation: (id: number, invitationId: number) =>
    client.delete(`/projects/${id}/invitations/${invitationId}`),
};
