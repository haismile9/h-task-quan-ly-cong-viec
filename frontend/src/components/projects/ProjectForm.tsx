import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useCreateProject, useUpdateProject } from "../../hooks/useProjects";
import { projectsApi } from "../../api/projects";
import { DEFAULT_BACKGROUND, backgroundCss, isImageBackground } from "../../utils/boardBackgrounds";
import BackgroundPicker from "./BackgroundPicker";
import type { Project } from "../../types";

interface ProjectFormProps {
  /** Có → sửa dự án; không có → tạo mới. */
  project?: Pick<Project, "id" | "name" | "description" | "background_url">;
  onDone: () => void;
  onCancel?: () => void;
  /** Bản gọn cho khung "Tạo mới" ở thanh trên cùng. */
  compact?: boolean;
}

/** Form tạo/sửa dự án: xem trước nền, chọn nền, tên, mô tả, cộng tác viên. */
const ProjectForm = ({ project, onDone, onCancel, compact }: ProjectFormProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [background, setBackground] = useState(
    project?.background_url?.startsWith("gradient:") || isImageBackground(project?.background_url)
      ? project!.background_url!
      : DEFAULT_BACKGROUND
  );

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const mutation = project ? updateProject : createProject;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const input = { name: name.trim(), description, background_url: background };
    try {
      if (project) {
        await updateProject.mutateAsync({ id: project.id, input });
        toast.success("Đã cập nhật dự án");
        onDone();
      } else {
        const created = await createProject.mutateAsync(input);
        toast.success("Đã tạo dự án");
        // Mời cộng tác viên qua cùng luồng với nút "Chia sẻ": email chưa có tài khoản sẽ nhận lời mời.
        const email = collaboratorEmail.trim();
        if (email) {
          projectsApi
            .addMember(created.id, email)
            .then((r) => (r.status === "invited" && !r.mail_sent ? toast.warning(r.message) : toast.success(r.message)))
            .catch((err) => toast.error(getErrorMessage(err, "Không mời được cộng tác viên.")));
        }
        onDone();
        navigate(`/projects/${created.id}`);
      }
    } catch {
      // Lỗi hiển thị bên dưới qua mutation.error
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Xem trước: nền + 3 cột giả lập */}
      <div
        className={`${compact ? "h-24" : "h-28"} rounded-lg flex items-center justify-center gap-1.5 p-3 shadow-inner`}
        style={{ background: backgroundCss(background) }}
      >
        {[3, 2, 4].map((cards, i) => (
          <div key={i} className="w-12 bg-base-100/90 rounded p-1 space-y-1 self-start shadow-sm">
            {Array.from({ length: cards }).map((_, j) => (
              <div key={j} className="h-1.5 bg-base-300 rounded" />
            ))}
          </div>
        ))}
      </div>

      <BackgroundPicker value={background} onChange={setBackground} />

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold">
          Tên dự án <span className="text-error">*</span>
        </span>
        <input
          className="input input-bordered input-sm w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {!name.trim() && <span className="text-base-content/60">👋 Tên dự án là bắt buộc</span>}
      </label>

      {!compact && (
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold">Mô tả</span>
          <textarea
            className="textarea textarea-bordered textarea-sm w-full"
            placeholder="Không bắt buộc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      )}

      {!project && (
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold">Mời cộng tác viên</span>
          <input
            type="email"
            className="input input-bordered input-sm w-full"
            placeholder="Email (không bắt buộc)"
            value={collaboratorEmail}
            onChange={(e) => setCollaboratorEmail(e.target.value)}
          />
        </label>
      )}

      {mutation.isError && (
        <p className="text-error text-xs">{getErrorMessage(mutation.error, "Có lỗi xảy ra khi lưu dự án.")}</p>
      )}

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={onCancel}>
            Huỷ
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm flex-1" disabled={!name.trim() || mutation.isPending}>
          {mutation.isPending && <span className="loading loading-spinner loading-xs" />}
          {project ? "Lưu" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
