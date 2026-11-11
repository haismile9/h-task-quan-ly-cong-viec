import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AiOutlineClose, AiOutlineSearch } from "react-icons/ai";
import { useAuth } from "../context/AuthContext";
import AccountMenu from "./AccountMenu";
import ProjectForm from "../components/projects/ProjectForm";

export { roleLabel } from "./AccountMenu";

/** Thanh trên cùng màu trắng: logo, tìm kiếm, nút "Tạo mới", menu tài khoản. */
const TopNav = () => {
  const { user } = useAuth();
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

  // Phím "/" (khi không đang gõ) để tìm kiếm, giống Trello
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/projects?q=${encodeURIComponent(q)}` : "/projects");
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
            ref={searchRef}
            type="search"
            className="grow min-w-0"
            placeholder="Tìm kiếm dự án  ( / )"
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

      <AccountMenu />
    </header>
  );
};

export default TopNav;
