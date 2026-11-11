import { Link } from "react-router-dom";
import { AiOutlineCheckCircle, AiOutlineExclamationCircle, AiOutlineProject, AiOutlineSync } from "react-icons/ai";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../hooks/useDashboard";
import { getErrorMessage } from "../api/client";
import Page from "../components/ui/Page";
import EmptyState from "../components/ui/EmptyState";
import SummaryCard from "../components/dashboard/SummaryCard";
import ProjectCard from "../components/dashboard/ProjectCard";

const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboard();

  return (
    <Page title="Tổng quan" subtitle={user ? `Chào ${user.name}, đây là tình hình công việc của bạn.` : undefined}>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-box" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="alert alert-error">
          <span>{getErrorMessage(error, "Không thể tải dữ liệu tổng quan.")}</span>
          <button className="btn btn-sm" onClick={() => refetch()}>
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              title="Dự án"
              value={data.project_summary.total}
              description={`${data.project_summary.done} đã xong · ${data.project_summary.doing} đang chạy`}
              icon={<AiOutlineProject />}
              tone="primary"
            />
            <SummaryCard
              title="Đã hoàn thành"
              value={data.task_summary.completed}
              description={
                data.task_summary.total > 0
                  ? `${Math.round((data.task_summary.completed / data.task_summary.total) * 100)}% tổng số nhiệm vụ`
                  : "Chưa có nhiệm vụ"
              }
              icon={<AiOutlineCheckCircle />}
              tone="success"
            />
            <SummaryCard
              title="Chưa xong"
              value={data.task_summary.pending + data.task_summary.in_progress}
              description={`trên tổng ${data.task_summary.total} nhiệm vụ`}
              icon={<AiOutlineSync />}
              tone="info"
            />
            <SummaryCard
              title="Quá hạn"
              value={data.task_summary.overdue}
              description={data.task_summary.overdue > 0 ? "Cần xử lý ngay" : "Mọi thứ đúng tiến độ"}
              icon={<AiOutlineExclamationCircle />}
              tone="error"
            />
          </div>

          <h2 className="text-lg font-semibold mb-3">Tiến độ dự án</h2>
          {data.projects.length === 0 ? (
            <EmptyState
              icon={<AiOutlineProject />}
              title="Chưa có dự án nào"
              action={
                <Link to="/projects" className="btn btn-primary btn-sm">
                  Đến trang dự án
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {data.activities && data.activities.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mt-8 mb-3">Hoạt động gần đây</h2>
              <ul className="bg-base-100 border border-base-300 rounded-box divide-y divide-base-300">
                {data.activities.map((activity, index) => (
                  <li key={index} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                    <p className="text-sm flex-1">{activity.content}</p>
                    <time className="text-xs text-base-content/50">
                      {new Date(activity.created_at).toLocaleDateString("vi-VN")}
                    </time>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Page>
  );
};

export default Dashboard;
