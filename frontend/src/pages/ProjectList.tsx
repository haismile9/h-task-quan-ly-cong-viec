import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AiOutlineClockCircle, AiOutlineProject, AiOutlineSearch } from "react-icons/ai";
import { useAuth } from "../context/AuthContext";
import { useDeleteProject, useProjects } from "../hooks/useProjects";
import { accessControl } from "../api/utils/access";
import { getErrorMessage } from "../api/client";
import Page, { Section } from "../components/ui/Page";
import EmptyState from "../components/ui/EmptyState";
import ProjectTile, { NewProjectTile } from "../components/projects/ProjectTile";
import CreateProjectModal from "../components/projects/CreateProjectModal";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";
import { getRecentProjectIds } from "../utils/recentProjects";
import type { Project } from "../types";

const GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";

const ProjectList = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const { data: projects = [], isLoading, error } = useProjects();
  const deleteProject = useDeleteProject();
  const confirm = useConfirm();
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Thông báo truyền qua navigation state (vd. khi bị chuyển từ trang khác về)
  useEffect(() => {
    if (!location.state?.message) return;
    toast.warning(location.state.message);
    window.history.replaceState({}, document.title);
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const recent = useMemo(() => {
    const byId = new Map(projects.map((p) => [p.id, p]));
    return getRecentProjectIds().map((id) => byId.get(id)).filter((p): p is Project => !!p);
  }, [projects]);

  const filtered = query ? projects.filter((p) => p.name.toLowerCase().includes(query)) : projects;

  if (!user) return null;
  const { canManageProjects } = accessControl(user.role);
  const canDelete = (p: Project) => user.role === "admin" || p.owner_id === user.id;

  const handleDelete = async (project: Project) => {
    const ok = await confirm({
      title: "Xoá dự án",
      message: `Bạn có chắc muốn xoá dự án "${project.name}"? Toàn bộ nhiệm vụ trong dự án sẽ bị xoá.`,
      confirmText: "Xoá",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Đã xoá dự án");
    } catch (err) {
      toast.error(getErrorMessage(err, "Lỗi khi xoá dự án."));
    }
  };

  const tiles = (list: Project[]) =>
    list.map((p) => <ProjectTile key={p.id} project={p} onDelete={canDelete(p) ? handleDelete : undefined} />);

  if (isLoading) {
    return (
      <Page title="Bảng">
        <div className={GRID}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[7.25rem] rounded-lg" />
          ))}
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Bảng">
        <div className="alert alert-error">{getErrorMessage(error, "Không thể tải dự án")}</div>
      </Page>
    );
  }

  // Đang tìm kiếm: chỉ hiện kết quả
  if (query) {
    return (
      <Page
        title={`Kết quả cho "${params.get("q")}"`}
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => setParams({})}>
            Xoá tìm kiếm
          </button>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={<AiOutlineSearch />} title="Không tìm thấy dự án phù hợp" />
        ) : (
          <div className={GRID}>{tiles(filtered)}</div>
        )}
      </Page>
    );
  }

  return (
    <Page title="Bảng" subtitle={`Xin chào, ${user.name}`}>
      {recent.length > 0 && (
        <Section icon={<AiOutlineClockCircle />} title="Đã xem gần đây">
          <div className={GRID}>{tiles(recent)}</div>
        </Section>
      )}

      <Section icon={<AiOutlineProject />} title="DỰ ÁN CỦA BẠN">
        {projects.length === 0 && !canManageProjects ? (
          <EmptyState
            icon={<AiOutlineProject />}
            title="Bạn chưa tham gia dự án nào"
            description="Hãy nhờ trưởng nhóm thêm bạn vào một dự án."
          />
        ) : (
          <div className={GRID}>
            {tiles(projects)}
            {canManageProjects && <NewProjectTile onClick={() => setShowCreateModal(true)} />}
          </div>
        )}
      </Section>

      {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} />}
    </Page>
  );
};

export default ProjectList;
