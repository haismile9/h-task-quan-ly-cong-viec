// Kiểu dữ liệu dùng chung, khớp với bảng và response của backend Laravel.

export type Role = "admin" | "leader" | "member";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** User rút gọn đi kèm task/comment (backend chỉ chọn id, name, email). */
export type UserSummary = Pick<User, "id" | "name"> & Partial<Pick<User, "email">>;

/** Thành viên dự án: user kèm pivot từ bảng project_user. */
export interface ProjectMember extends User {
  pivot?: { project_id: number; user_id: number; role: string };
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  background_url: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  owner?: User;
  users?: ProjectMember[];
  /** Lời mời gửi tới email chưa có tài khoản (chỉ có khi xem chi tiết dự án). */
  pending_invitations?: PendingInvitation[];
}

export interface PendingInvitation {
  id: number;
  email: string;
  created_at: string;
}

/** Kết quả POST /projects/{id}/members. */
export type AddMemberResult =
  | { status: "added"; message: string }
  | { status: "invited"; message: string; mail_sent: boolean; invite_url: string };

/** GET /invitations/{token} (công khai). */
export interface InvitationInfo {
  email: string;
  accepted: boolean;
  has_account: boolean;
  project: { id: number; name: string; background_url: string | null };
  inviter_name: string | null;
}

export type TaskStatus = "pending" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  assigned_users?: UserSummary[];
}

/** Item trả về từ GET /my-tasks. */
export interface MyTask {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  project_id: number;
  project_name: string;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: User;
}

// ----- Dashboard (GET /dashboard) -----

export interface TaskSummary {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
}

export interface ProjectSummary {
  total: number;
  done: number;
  doing: number;
  planned: number;
}

export interface DashboardTask {
  id: number;
  title: string;
  status: TaskStatus;
  deadline?: string | null;
}

export interface DashboardProject {
  id: number;
  name: string;
  description?: string | null;
  owner?: UserSummary;
  members?: UserSummary[];
  tasks: {
    completed: DashboardTask[];
    pending: DashboardTask[];
    in_progress: DashboardTask[];
    overdue: DashboardTask[];
  };
  task_summary: TaskSummary;
}

export interface DashboardData {
  task_summary: TaskSummary;
  project_summary: ProjectSummary;
  projects: DashboardProject[];
  activities?: Array<{ type: string; content: string; created_at: string }>;
}

// ----- Lỗi validation của Laravel (422) -----

export type FieldErrors = Record<string, string[]>;
