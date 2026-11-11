import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDeleteProject, useProjects } from "../hooks/useProjects";
import { accessControl } from "../api/utils/access";
import { getErrorMessage } from "../api/client";
import BoardCard from "../components/BoardCard";
import NewBoardCard from "../components/NewBoardCard";
import CreateProjectModal from "../components/projects/CreateProjectModal";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

const ProjectList = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { data: projects = [], isLoading, error } = useProjects();
  const deleteProject = useDeleteProject();
  const confirm = useConfirm();
  const toast = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  // Thông báo truyền qua navigation state (vd. khi bị chuyển từ trang khác về)
  useEffect(() => {
    if (!location.state?.message) return;
    toast.warning(location.state.message);
    window.history.replaceState({}, document.title);
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;
  const permissions = accessControl(user.role);

  const handleDeleteProject = async (id: number) => {
    const project = projects.find((p) => p.id === id);
    const ok = await confirm({
      title: "Xoá dự án",
      message: `Bạn có chắc muốn xoá dự án "${project?.name ?? ""}"? Toàn bộ nhiệm vụ trong dự án sẽ bị xoá.`,
      confirmText: "Xoá",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Đã xoá dự án");
    } catch (err) {
      toast.error(getErrorMessage(err, "Lỗi khi xoá dự án."));
    }
  };

  const handleDropToTrash = () => {
    if (draggingId !== null) {
      handleDeleteProject(draggingId);
      setDraggingId(null);
    }
  };

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Xin chào, {user.name}</h1>
        {permissions.canManageProjects && (
          <button className="btn btn-success btn-sm" onClick={() => setShowCreateModal(true)}>
            + Tạo Dự Án
          </button>
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Danh sách dự án</h2>

      {isLoading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-error">{getErrorMessage(error, "Không thể tải dự án")}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <NewBoardCard onClick={() => setShowCreateModal(true)} />
        {projects.map((project) => (
          <BoardCard
            key={project.id}
            id={project.id}
            title={project.name}
            description={project.description || "Không có mô tả"}
            backgroundUrl={project.background_url ?? undefined}
            draggable
            onDragStart={(id) => id && setDraggingId(id)}
          />
        ))}
      </div>

      {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} />}

      {/* 🗑 Kéo thẻ dự án vào đây để xoá */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropToTrash}
        className="fixed bottom-6 right-6 z-50 w-24 h-24 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition cursor-pointer"
      >
        🗑
      </div>
    </div>
  );
};

export default ProjectList;
