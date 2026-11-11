import client from "./client";
import type { User } from "../types";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ token: string; user?: User }>("/login", { email, password }).then((r) => r.data),

  logout: () => client.post("/logout"),

  me: () => client.get<User>("/user").then((r) => r.data),

  register: (input: RegisterInput) => client.post("/register", input),

  verifyEmail: (email: string, code: string) =>
    client.post<{ token: string; user: User }>("/verify-email", { email, code }).then((r) => r.data),

  resendCode: (email: string) => client.post("/resend-code", { email }),

  sendResetCode: (email: string) => client.post("/password/reset/send-code", { email }),

  verifyResetCode: (email: string, code: string) =>
    client.post("/password/reset/verify-code", { email, code }),

  resetPassword: (input: { email: string; code: string; password: string; password_confirmation: string }) =>
    client.post("/password/reset", input),

  changePassword: (input: { current_password: string; password: string; password_confirmation: string }) =>
    client.put<{ message: string }>("/account/password", input).then((r) => r.data),

  updateSettings: (input: { email_deadline_reminders: boolean }) =>
    client.put<{ message: string; user: User }>("/account/settings", input).then((r) => r.data.user),

  updateProfile: (input: { name: string }) =>
    client.put<{ message: string; user: User }>("/account", input).then((r) => r.data.user),
};
