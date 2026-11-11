import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineCheck } from "react-icons/ai";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useCreateProject, useUpdateProject } from "../../hooks/useProjects";
import { BOARD_GRADIENTS, DEFAULT_BACKGROUND, backgroundCss } from "../../utils/boardBackgrounds";
import type { Project } from "../../types";

interface ProjectFormProps {
  /** Có → sửa dự án; không có → tạo mới. */
  project?: Pick<Project, "id" | "name" | "description" | "background_url">;
  onDone: () => void;
  onCancel?: () => void;
  /** Bản gọn cho khung "Tạo mới" ở thanh trên cùng. */
  compact?: boolean;
}

const BACKGROUND_OPTIONS = BOARD_GRADIENTS.map((g) => ({ value: `gradient:${g.id}`, label: g.label }));

/** Form tạo/sửa dự án: xem trước nền, chọn nền, tên, mô tả, cộng tác viên. */
const ProjectForm = ({ project, onDone, onCancel, compact }: ProjectFormProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [background, setBackground] = useState(
    project?.background_url?.startsWith("gradient:") ? project.background_url : DEFAULT_BACKGROUND
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
        const email = collaboratorEmail.trim();
        const created = await createProject.mutateAsync({ ...input, ...(email ? { collaborator_email: email } : {}) });
        toast.success("Đã tạo dự án");
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

      <div>
        <p className="text-xs font-semibold mb-1.5">Phông nền</p>
        <div className="grid grid-cols-6 gap-1.5">
          {BACKGROUND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              aria-label={`Nền ${opt.label}`}
              aria-pressed={background === opt.value}
              onClick={() => setBackground(opt.value)}
              className="h-8 rounded-md flex items-center justify-center text-white hover:opacity-90"
              style={{ background: backgroundCss(opt.value) }}
            >
              {background === opt.value && <AiOutlineCheck />}
            </button>
          ))}
        </div>
      </div>

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
