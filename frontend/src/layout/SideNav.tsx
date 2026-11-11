import { NavLink } from "react-router-dom";
import { AiOutlineCheckSquare, AiOutlineDashboard, AiOutlineProject, AiOutlineUser } from "react-icons/ai";
import { useProjects } from "../hooks/useProjects";
import { backgroundCss } from "../utils/boardBackgrounds";

const NAV_ITEMS = [
  { to: "/projects", label: "Bảng", icon: <AiOutlineProject /> },
  { to: "/my-task", label: "Công việc của tôi", icon: <AiOutlineCheckSquare /> },
  { to: "/dashboard", label: "Tổng quan", icon: <AiOutlineDashboard /> },
  { to: "/account", label: "Hồ sơ", icon: <AiOutlineUser /> },
];

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
    isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-base-200"
  }`;

/** Menu trái cho các trang nội dung (ẩn trên mobile, thay bằng thanh tab ngang). */
const SideNav = () => {
  const { data: projects = [] } = useProjects();

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block w-64 shrink-0 px-4 py-6">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/projects"} className={itemClass}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {projects.length > 0 && (
          <>
            <div className="border-t border-base-300 my-4" />
            <p className="px-3 mb-2 text-xs font-semibold text-base-content/60">Dự án của bạn</p>
            <nav className="space-y-0.5 max-h-[50vh] overflow-y-auto">
              {projects.map((p) => (
                <NavLink key={p.id} to={`/projects/${p.id}`} className={itemClass}>
                  <span className="w-6 h-5 rounded shrink-0" style={{ background: backgroundCss(p.background_url) }} />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
            </nav>
          </>
        )}
      </aside>

      {/* Mobile */}
      <nav className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-base-300">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/projects"} className={itemClass}>
            {item.icon}
            <span className="whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default SideNav;
