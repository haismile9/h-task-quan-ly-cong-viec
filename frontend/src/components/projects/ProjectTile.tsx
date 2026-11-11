import { Link } from "react-router-dom";
import { AiOutlineDelete } from "react-icons/ai";
import type { Project } from "../../types";
import { backgroundCss } from "../../utils/boardBackgrounds";

interface ProjectTileProps {
  project: Project;
  /** Có → hiện nút xoá khi rê chuột. */
  onDelete?: (project: Project) => void;
}

/** Ô dự án: dải nền màu/ảnh phía trên, tên trên nền trắng phía dưới. */
const ProjectTile = ({ project, onDelete }: ProjectTileProps) => (
  <div className="relative group">
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-lg overflow-hidden bg-base-100 shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f] hover:shadow-md transition"
    >
      <div className="h-20 group-hover:brightness-95 transition" style={{ background: backgroundCss(project.background_url) }} />
      <div className="px-3 py-2.5">
        <p className="text-sm truncate">{project.name}</p>
      </div>
    </Link>
    {onDelete && (
      <button
        onClick={() => onDelete(project)}
        className="btn btn-xs btn-square absolute top-2 right-2 border-none bg-base-100/90 text-error opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
        aria-label={`Xoá dự án ${project.name}`}
        title="Xoá dự án"
      >
        <AiOutlineDelete />
      </button>
    )}
  </div>
);

/** Ô "Tạo dự án mới". */
export const NewProjectTile = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="min-h-[7.25rem] rounded-lg bg-base-200 hover:bg-base-300 transition flex items-center justify-center text-sm text-base-content/80 shadow-[0_1px_1px_#091e4240]"
  >
    Tạo dự án mới
  </button>
);

export default ProjectTile;
