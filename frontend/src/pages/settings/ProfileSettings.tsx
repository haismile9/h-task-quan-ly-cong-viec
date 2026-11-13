import { useState } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/ui/Avatar";
import { roleLabel } from "../../layout/AccountMenu";
import ChangePasswordModal from "../../components/account/ChangePasswordModal";
import EditProfileModal from "../../components/account/EditProfileModal";

/** Hồ sơ: thẻ thông tin (sửa họ tên qua modal) + đổi mật khẩu. */
const ProfileSettings = () => {
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!user) return null;

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Hồ sơ</h1>

      {/* Thẻ hồ sơ */}
      <div className="rounded-box overflow-hidden border border-base-300 mb-10">
        <div className="h-20 bg-board" />
        <div className="px-6 pb-6 -mt-10 flex flex-wrap items-end gap-4">
          <Avatar name={user.name} size="md" className="!w-24 !h-24 !text-3xl ring-4 ring-base-100" />
          <div className="pb-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold truncate">{user.name}</p>
              <span className="badge badge-primary badge-soft badge-sm">{roleLabel[user.role] ?? user.role}</span>
            </div>
            <p className="text-sm text-base-content/60 truncate">{user.email}</p>
          </div>
          <button className="btn btn-outline btn-sm ml-auto mb-1" onClick={() => setShowEdit(true)}>
            <AiOutlineEdit /> Sửa hồ sơ
          </button>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold border-b border-base-300 pb-2 mb-4">Bảo mật</h2>
        <div className="flex flex-wrap items-center gap-4 max-w-md">
          <div className="flex-1">
            <p className="text-sm font-semibold">Mật khẩu</p>
            <p className="text-base-content/60 tracking-widest">••••••••</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowPassword(true)}>
            Đổi mật khẩu
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold border-b border-base-300 pb-2 mb-4">Khả năng hiển thị</h2>
        <ul className="text-sm text-base-content/70 space-y-2 list-disc pl-5">
          <li>Tên và ảnh đại diện hiển thị với mọi thành viên trong các dự án bạn tham gia.</li>
          <li>Email chỉ hiển thị với thành viên của các dự án mà bạn cùng tham gia.</li>
          <li>Hoạt động của bạn chỉ hiển thị với thành viên của dự án nơi hoạt động diễn ra.</li>
        </ul>
      </section>
      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </>
  );
};

export default ProfileSettings;
