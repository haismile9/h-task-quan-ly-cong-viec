import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AiOutlineClose, AiOutlineCreditCard, AiOutlineHistory, AiOutlineSetting, AiOutlineUser } from "react-icons/ai";

export const SETTINGS_NAV = [
  { to: "/u/profile", label: "Hồ sơ", icon: <AiOutlineUser /> },
  { to: "/u/activity", label: "Hoạt động", icon: <AiOutlineHistory /> },
  { to: "/u/cards", label: "Thẻ", icon: <AiOutlineCreditCard /> },
  { to: "/u/settings", label: "Cài đặt", icon: <AiOutlineSetting /> },
];

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition border ${
    isActive ? "bg-primary/10 text-primary font-semibold border-primary/40" : "border-transparent hover:bg-base-300/60"
  }`;

/** Khung "Cài đặt cá nhân": menu trái riêng, nội dung giữa, nút ✕ để quay lại bảng. */
const SettingsLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0">
      <aside className="md:w-72 shrink-0 bg-base-200 border-b md:border-b-0 md:border-r border-base-300 px-4 py-6">
        <p className="px-3 mb-3 text-sm font-semibold text-base-content/70">Cài đặt cá nhân</p>
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {SETTINGS_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={itemClass}>
              <span className="text-base">{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="flex-1 min-w-0 relative">
        <button
          className="btn btn-circle btn-ghost border border-base-300 absolute top-4 right-4 z-10"
          onClick={() => navigate("/projects")}
          aria-label="Đóng cài đặt"
          title="Đóng"
        >
          <AiOutlineClose />
        </button>
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          <Outlet />
        </div>
      </section>
    </div>
  );
};

export default SettingsLayout;
