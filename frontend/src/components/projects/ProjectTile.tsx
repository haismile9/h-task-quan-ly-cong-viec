import { Link } from "react-router-dom";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import type { Project } from "../../types";
import { backgroundCss } from "../../utils/boardBackgrounds";
import { useStarredProjects } from "../../hooks/useStarredProjects";

/** Ô dự án: dải nền phía trên, tên phía dưới, nút gắn sao khi rê chuột. */
const ProjectTile = ({ project }: { project: Project }) => {
  const { isStarred, toggleStar } = useStarredProjects();
  const starred = isStarred(project.id);

  return (
    <div className="relative group">
      <Link
        to={`/projects/${project.id}`}
        className="block rounded-lg overflow-hidden bg-base-100 shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f] hover:shadow-md transition"
      >
        <div className="h-20 group-hover:brightness-90 transition" style={{ background: backgroundCss(project.background_url) }} />
        <div className="px-3 py-2.5">
          <p className="text-sm truncate">{project.name}</p>
        </div>
      </Link>
      <button
        onClick={() => toggleStar(project.id)}
        className={`absolute top-2 right-2 w-7 h-7 rounded flex items-center justify-center text-base transition hover:scale-110 ${
          starred ? "text-warning opacity-100" : "text-white bg-black/20 opacity-0 group-hover:opacity-100 focus:opacity-100"
        }`}
        aria-pressed={starred}
        aria-label={starred ? `Bỏ gắn sao ${project.name}` : `Gắn sao ${project.name}`}
        title={starred ? "Bỏ gắn sao" : "Gắn sao để dự án hiện ở mục Đã gắn sao"}
      >
        {starred ? <AiFillStar className="drop-shadow" /> : <AiOutlineStar />}
      </button>
    </div>
  );
};

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
