import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AiOutlineClose, AiOutlineSearch } from "react-icons/ai";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import ProjectForm from "../components/projects/ProjectForm";
import { closeDropdown } from "../utils/closeDropdown";

export const roleLabel: Record<string, string> = { admin: "Quản trị viên", leader: "Trưởng nhóm", member: "Thành viên" };

/** Thanh trên cùng màu trắng: logo, tìm kiếm, nút "Tạo mới", menu tài khoản. */
const TopNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [creating, setCreating] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);

  // Backend cho mọi người dùng đã đăng nhập tạo dự án (người tạo là chủ dự án).
  const canCreate = !!user;

  // Đóng khung "Tạo mới" khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!creating) return;
    const onClick = (e: MouseEvent) => {
      if (!createRef.current?.contains(e.target as Node)) setCreating(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCreating(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [creating]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/projects?q=${encodeURIComponent(q)}` : "/projects");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-12 shrink-0 bg-base-100 border-b border-base-300 flex items-center gap-2 sm:gap-3 px-2 sm:px-4 sticky top-0 z-40">
      <Link to="/projects" className="flex items-center gap-2 px-1.5 rounded hover:bg-base-200 h-8 shrink-0">
        <img src="/img/favicon-32x32.png" alt="" className="w-6 h-6 rounded" />
        <span className="font-bold text-lg tracking-tight hidden sm:inline">H-Task</span>
      </Link>

      <form onSubmit={handleSearch} className="flex-1 flex justify-center min-w-0">
        <label className="input input-sm input-bordered w-full max-w-2xl flex items-center gap-2 bg-base-100">
          <AiOutlineSearch className="text-base-content/50 shrink-0" />
          <input
            type="search"
            className="grow min-w-0"
            placeholder="Tìm kiếm dự án"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Tìm kiếm dự án"
          />
        </label>
      </form>

      {canCreate && (
        <div className="relative shrink-0" ref={createRef}>
          <button className="btn btn-primary btn-sm" onClick={() => setCreating((v) => !v)} aria-expanded={creating}>
            Tạo mới
          </button>
          {creating && (
            <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-box shadow-xl border border-base-300 p-4 z-50">
              <div className="flex items-center justify-between mb-3">
                <span className="w-6" />
                <h2 className="text-sm font-semibold">Tạo dự án</h2>
                <button className="btn btn-ghost btn-xs btn-square" onClick={() => setCreating(false)} aria-label="Đóng">
                  <AiOutlineClose />
                </button>
              </div>
              <ProjectForm compact onDone={() => setCreating(false)} />
            </div>
          )}
        </div>
      )}

      {user && (
        <div className="dropdown dropdown-end shrink-0">
          <button tabIndex={0} className="rounded-full hover:ring-2 hover:ring-base-300 flex" aria-label="Tài khoản">
            <Avatar name={user.name} size="sm" />
          </button>
          <div tabIndex={0} className="dropdown-content bg-base-100 rounded-box shadow-xl border border-base-300 w-72 mt-2 z-50 p-2">
            <p className="text-xs font-semibold text-base-content/60 px-2 pt-1 pb-2 uppercase">Tài khoản</p>
            <div className="flex items-center gap-3 px-2 pb-3 border-b border-base-300">
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-xs text-base-content/60 truncate">{user.email}</p>
                <p className="text-xs text-primary">{roleLabel[user.role] ?? user.role}</p>
              </div>
            </div>
            <ul className="menu p-0 pt-1 w-full" onClick={closeDropdown}>
              <li>
                <Link to="/account">Hồ sơ và cài đặt</Link>
              </li>
              <li>
                <Link to="/my-task">Công việc của tôi</Link>
              </li>
              <li className="border-t border-base-300 mt-1 pt-1">
                <button onClick={handleLogout}>Đăng xuất</button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNav;
