import { useState } from "react";
import { getErrorMessage } from "../../api/client";
import { useCreateProject, useUpdateProject } from "../../hooks/useProjects";
import type { Project } from "../../types";

interface Props {
  onClose: () => void;
  project?: Pick<Project, "id" | "name" | "description" | "background_url">;
}

const predefinedImages = [
  { label: "Scrum Board", url: "/img/undraw_scrum-board_uqku.png" },
  { label: "Schedule", url: "/img/undraw_schedule_6t8k.png" },
  { label: "Next Tasks", url: "/img/undraw_next-tasks_y3rm.png" },
  { label: "Date Picker", url: "/img/undraw_date-picker_qe47.png" },
  { label: "Booked", url: "/img/undraw_booked_bb22.png" },
];

const CreateProjectModal = ({ onClose, project }: Props) => {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [selectedImage, setSelectedImage] = useState(
    project?.background_url || predefinedImages[0].url
  );
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const mutation = project ? updateProject : createProject;
  const loading = mutation.isPending;
  const error = mutation.isError ? getErrorMessage(mutation.error, "Có lỗi xảy ra khi lưu dự án.") : "";

  const handleSubmit = async () => {
    const input = { name: name.trim(), description, background_url: selectedImage };
    try {
      if (project) {
        await updateProject.mutateAsync({ id: project.id, input });
      } else {
        const email = collaboratorEmail.trim();
        await createProject.mutateAsync({ ...input, ...(email ? { collaborator_email: email } : {}) });
      }
      onClose();
    } catch {
      // Lỗi đã được hiển thị qua mutation.error
    }
  };

  return (
    <>
      {/* 🧱 Modal */}
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-base-100 rounded-lg p-6 w-96">
          <h2 className="text-xl font-bold mb-4">
            {project ? "✏️ Sửa Dự Án" : "➕ Tạo Dự Án Mới"}
          </h2>

          <input
            type="text"
            placeholder="Tên dự án"
            className="input input-bordered w-full mb-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <textarea
            placeholder="Mô tả (tùy chọn)"
            className="textarea textarea-bordered w-full mb-3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {!project && (
            <input
              type="email"
              placeholder="Email cộng tác (tùy chọn)"
              className="input input-bordered w-full mb-3"
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
            />
          )}

          <div className="mb-3">
            <label className="block mb-1 font-semibold text-sm">Ảnh nền</label>
            <select
              className="select select-bordered w-full"
              value={selectedImage}
              onChange={(e) => setSelectedImage(e.target.value)}
            >
              {predefinedImages.map((img) => (
                <option key={img.url} value={img.url}>
                  {img.label}
                </option>
              ))}
            </select>
          </div>

          <img
            src={selectedImage}
            alt="Preview"
            className="rounded w-full h-40 object-cover mb-3 border"
          />

          {error && <p className="text-error text-sm mb-3">{error}</p>}

          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={onClose}>
              Hủy
            </button>
            <button
              className={`btn btn-primary ${loading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={loading || !name}
            >
              {project ? "Lưu" : "Tạo"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateProjectModal;
