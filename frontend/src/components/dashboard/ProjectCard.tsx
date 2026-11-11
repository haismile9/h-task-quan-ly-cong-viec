import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import type { DashboardProject } from "../../types";

/** Tiến độ một dự án trên trang Tổng quan. */
const ProjectCard = ({ project }: { project: DashboardProject }) => {
  const { total, completed, in_progress, pending, overdue } = project.task_summary;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const stats = [
    { label: "Hoàn thành", value: completed, className: "text-success" },
    { label: "Chưa xong", value: pending + in_progress, className: "text-info" },
    { label: "Quá hạn", value: overdue, className: "text-error" },
  ];

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-base-100 border border-base-300 rounded-box p-4 hover:border-primary hover:shadow-sm transition"
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-base-content/60 line-clamp-1">{project.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-primary">{percent}%</p>
          <p className="text-xs text-base-content/50">
            {completed}/{total} nhiệm vụ
          </p>
        </div>
      </div>

      <progress className="progress progress-primary w-full h-2" value={percent} max={100} />

      <div className="grid grid-cols-3 gap-2 text-xs mt-3 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className={`font-semibold ${s.className}`}>{s.value}</p>
            <p className="text-base-content/50">{s.label}</p>
          </div>
        ))}
      </div>

      {project.owner && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-base-300 text-sm text-base-content/70">
          <Avatar name={project.owner.name} size="xs" />
          Chủ dự án: <span className="font-medium text-base-content">{project.owner.name}</span>
        </div>
      )}
    </Link>
  );
};

export default ProjectCard;
