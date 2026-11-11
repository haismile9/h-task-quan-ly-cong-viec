import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useProject } from "../hooks/useProjects";
import { getErrorMessage, getStatus } from "../api/client";
import TaskBoard from "../components/tasks/TaskBoard";

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);
  const { data: project, isLoading, error } = useProject(projectId);

  // Backend trả 404 cho cả dự án không tồn tại lẫn không có quyền xem.
  if (!projectId || getStatus(error) === 404 || getStatus(error) === 403) {
    return <Navigate to="/404" replace />;
  }

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64">
        <div className="loading loading-spinner loading-lg mb-4"></div>
        <p className="text-gray-600">Đang tải dự án...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 text-center">
        <div className="alert alert-error max-w-md mx-auto">
          <span>{getErrorMessage(error, "Không thể tải thông tin dự án.")}</span>
        </div>
        <button onClick={() => navigate("/projects")} className="btn btn-primary mt-4">
          Quay về danh sách dự án
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
      <p className="mb-4">{project.description}</p>
      <p className="text-sm text-gray-500">
        Tạo ngày: {new Date(project.created_at).toLocaleDateString("vi-VN")}
      </p>
      <TaskBoard project={project} />
    </div>
  );
};

export default ProjectDetails;
