import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/ui/Avatar";
import FormField from "../../components/ui/FormField";
import { useToast } from "../../components/ui/Toast";
import { roleLabel } from "../../layout/AccountMenu";
import ChangePasswordModal from "../../components/account/ChangePasswordModal";

/** Hồ sơ và khả năng hiển thị: thông tin cá nhân + đổi mật khẩu. */
const ProfileSettings = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [showPassword, setShowPassword] = useState(false);

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateProfile({ name: name.trim() }),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Đã cập nhật hồ sơ");
    },
  });


  if (!user) return null;

  const submitProfile = (e: FormEvent) => {
    e.preventDefault();
    updateProfile.mutate();
  };


  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Hồ sơ và khả năng hiển thị</h1>

      {/* Thẻ hồ sơ */}
      <div className="rounded-box overflow-hidden border border-base-300 mb-10">
        <div className="h-20 bg-board" />
        <div className="px-6 pb-6 -mt-10 flex flex-wrap items-end gap-4">
          <Avatar name={user.name} size="md" className="!w-24 !h-24 !text-3xl ring-4 ring-base-100" />
          <div className="pb-1">
            <p className="text-xl font-bold">{user.name}</p>
            <p className="text-sm text-base-content/60">{user.email}</p>
          </div>
          <span className="badge badge-primary badge-soft ml-auto mb-2">{roleLabel[user.role] ?? user.role}</span>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold border-b border-base-300 pb-2 mb-4">Thông tin cá nhân</h2>
        <form onSubmit={submitProfile} className="space-y-4 max-w-md">
          <FormField label="Họ tên" value={name} onChange={(e) => setName(e.target.value)} />
          <FormField label="Email" value={user.email} disabled />
          {updateProfile.isError && <p className="text-error text-sm">{getErrorMessage(updateProfile.error)}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim() || name.trim() === user.name || updateProfile.isPending}
          >
            Lưu thay đổi
          </button>
        </form>
      </section>

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
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </>
  );
};

export default ProfileSettings;
