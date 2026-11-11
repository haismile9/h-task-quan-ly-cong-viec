import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineCreditCard,
  AiOutlineHistory,
  AiOutlineLogout,
  AiOutlineProject,
  AiOutlineQuestionCircle,
  AiOutlineSetting,
  AiOutlineUser,
} from "react-icons/ai";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import AnchoredPopover from "../components/ui/AnchoredPopover";
import Modal from "../components/ui/Modal";

export const roleLabel: Record<string, string> = { admin: "Quản trị viên", leader: "Trưởng nhóm", member: "Thành viên" };

const SHORTCUTS: Array<[string, string]> = [
  ["/", "Tìm kiếm dự án"],
  ["Enter", "Thêm thẻ / danh sách, lưu tiêu đề"],
  ["Shift + Enter", "Xuống dòng khi nhập thẻ"],
  ["Ctrl + Enter", "Gửi bình luận"],
  ["Esc", "Đóng popup, modal hoặc ô nhập"],
];

/** Avatar góc phải + menu tài khoản đầy đủ (giống Trello). */
const AccountMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  if (!user) return null;

  const go = (to: string) => {
    setAnchor(null);
    navigate(to);
  };

  const Item = ({ icon, children, onClick }: { icon?: ReactNode; children: ReactNode; onClick: () => void }) => (
    <li>
      <button onClick={onClick} className="py-2">
        {icon && <span className="text-base text-base-content/70">{icon}</span>}
        {children}
      </button>
    </li>
  );

  return (
    <>
      <button
        className="rounded-full hover:ring-2 hover:ring-base-300 flex shrink-0"
        aria-label="Tài khoản"
        aria-expanded={!!anchor}
        onClick={(e) => {
          const el = e.currentTarget;
          setAnchor((cur) => (cur ? null : el));
        }}
      >
        <Avatar name={user.name} size="sm" />
      </button>

      {anchor && (
        <AnchoredPopover anchor={anchor} onClose={() => setAnchor(null)} width={304} label="Tài khoản" className="p-2">
          <p className="text-xs font-semibold text-base-content/60 px-3 pt-2 pb-2 uppercase">Tài khoản</p>
          <div className="flex items-center gap-3 px-3 pb-3">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-xs text-base-content/60 truncate">{user.email}</p>
              <p className="text-xs text-primary">{roleLabel[user.role] ?? user.role}</p>
            </div>
          </div>
          <ul className="menu w-full p-0">
            <Item icon={<AiOutlineUser />} onClick={() => go("/u/profile")}>
              Quản lý tài khoản
            </Item>
          </ul>

          <div className="border-t border-base-300 my-2" />
          <p className="text-xs font-semibold text-base-content/60 px-3 pb-1 uppercase">H-Task</p>
          <ul className="menu w-full p-0">
            <Item icon={<AiOutlineUser />} onClick={() => go("/u/profile")}>
              Hồ sơ và hiển thị
            </Item>
            <Item icon={<AiOutlineHistory />} onClick={() => go("/u/activity")}>
              Hoạt động
            </Item>
            <Item icon={<AiOutlineCreditCard />} onClick={() => go("/u/cards")}>
              Thẻ
            </Item>
            <Item icon={<AiOutlineSetting />} onClick={() => go("/u/settings")}>
              Cài đặt
            </Item>
          </ul>

          <div className="border-t border-base-300 my-2" />
          <ul className="menu w-full p-0">
            <Item icon={<AiOutlineProject />} onClick={() => go("/projects")}>
              Bảng của tôi
            </Item>
            <Item
              icon={<AiOutlineQuestionCircle />}
              onClick={() => {
                setAnchor(null);
                setShowShortcuts(true);
              }}
            >
              Phím tắt
            </Item>
          </ul>

          <div className="border-t border-base-300 my-2" />
          <ul className="menu w-full p-0">
            <Item
              icon={<AiOutlineLogout />}
              onClick={async () => {
                setAnchor(null);
                await logout();
                navigate("/login");
              }}
            >
              Đăng xuất
            </Item>
          </ul>
        </AnchoredPopover>
      )}

      {showShortcuts && (
        <Modal title="Phím tắt" size="sm" onClose={() => setShowShortcuts(false)}>
          <table className="table table-sm">
            <tbody>
              {SHORTCUTS.map(([key, desc]) => (
                <tr key={key}>
                  <td className="w-32">
                    <kbd className="kbd kbd-sm">{key}</kbd>
                  </td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </>
  );
};

export default AccountMenu;
