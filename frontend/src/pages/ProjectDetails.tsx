import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useProject } from "../hooks/useProjects";
import { getErrorMessage, getStatus } from "../api/client";
import TaskBoard from "../components/tasks/TaskBoard";
import { boardPageBackground } from "../utils/boardBackgrounds";
import { markProjectViewed } from "../utils/recentProjects";

/** Trang bảng công việc: khung bo góc chiếm trọn phần còn lại dưới thanh trên cùng. */
const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { data: project, isLoading, error } = useProject(projectId);

  useEffect(() => {
    if (project) markProjectViewed(project.id);
  }, [project]);

  // Backend trả 404 cho cả dự án không tồn tại lẫn không có quyền xem.
  if (!projectId || getStatus(error) === 404 || getStatus(error) === 403) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="h-[calc(100vh-3rem)] p-2">
      <div
        className="h-full rounded-xl overflow-hidden flex flex-col"
        style={{ background: boardPageBackground(project?.background_url) }}
      >
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-white gap-2">
            <span className="loading loading-spinner loading-lg" /> Đang tải dự án...
          </div>
        ) : error || !project ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
            <div className="alert alert-error max-w-md">{getErrorMessage(error, "Không thể tải thông tin dự án.")}</div>
            <Link to="/projects" className="btn bg-base-100 text-primary border-none">
              Quay về danh sách dự án
            </Link>
          </div>
        ) : (
          <TaskBoard project={project} />
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
