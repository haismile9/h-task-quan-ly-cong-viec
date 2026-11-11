import client from "./client";
import type { InvitationInfo, User } from "../types";

/** Luồng nhận lời mời vào dự án, dùng được khi chưa đăng nhập. */
export const invitationsApi = {
  get: (token: string) => client.get<InvitationInfo>(`/invitations/${token}`).then((r) => r.data),

  sendCode: (token: string) => client.post(`/invitations/${token}/send-code`),

  verifyCode: (token: string, code: string) => client.post(`/invitations/${token}/verify-code`, { code }),

  accept: (token: string, input: { code: string; name: string; password: string }) =>
    client
      .post<{ token: string; user: User; project_id: number }>(`/invitations/${token}/accept`, {
        ...input,
        password_confirmation: input.password,
      })
      .then((r) => r.data),
};
