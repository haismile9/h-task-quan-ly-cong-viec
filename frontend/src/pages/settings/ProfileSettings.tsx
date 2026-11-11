import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../api/auth";
import { getErrorMessage, getFieldErrors } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/ui/Avatar";
import FormField from "../../components/ui/FormField";
import { useToast } from "../../components/ui/Toast";
import { roleLabel } from "../../layout/TopNav";

/** Hồ sơ và khả năng hiển thị: thông tin cá nhân + đổi mật khẩu. */
const ProfileSettings = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [pw, setPw] = useState({ current_password: "", password: "", password_confirmation: "" });

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateProfile({ name: name.trim() }),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Đã cập nhật hồ sơ");
    },
  });

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(pw),
    onSuccess: () => {
      setPw({ current_password: "", password: "", password_confirmation: "" });
      toast.success("Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất.");
    },
  });
  const pwErrors = getFieldErrors(changePassword.error);

  if (!user) return null;

  const submitProfile = (e: FormEvent) => {
    e.preventDefault();
    updateProfile.mutate();
  };
  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    changePassword.mutate();
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
        <h2 className="text-lg font-semibold border-b border-base-300 pb-2 mb-4">Đổi mật khẩu</h2>
        <form onSubmit={submitPassword} className="space-y-4 max-w-md">
          <FormField
            label="Mật khẩu hiện tại"
            type="password"
            autoComplete="current-password"
            value={pw.current_password}
            onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
            errors={pwErrors.current_password}
          />
          <FormField
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            placeholder="Ít nhất 8 ký tự"
            value={pw.password}
            onChange={(e) => setPw({ ...pw, password: e.target.value })}
            errors={pwErrors.password}
          />
          <FormField
            label="Xác nhận mật khẩu mới"
            type="password"
            autoComplete="new-password"
            value={pw.password_confirmation}
            onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })}
          />
          {changePassword.isError && !Object.keys(pwErrors).length && (
            <p className="text-error text-sm">{getErrorMessage(changePassword.error)}</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!pw.current_password || pw.password.length < 8 || changePassword.isPending}
          >
            Đổi mật khẩu
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold border-b border-base-300 pb-2 mb-4">Khả năng hiển thị</h2>
        <ul className="text-sm text-base-content/70 space-y-2 list-disc pl-5">
          <li>Tên và ảnh đại diện hiển thị với mọi thành viên trong các dự án bạn tham gia.</li>
          <li>Email chỉ hiển thị với thành viên của các dự án mà bạn cùng tham gia.</li>
          <li>Hoạt động của bạn chỉ hiển thị với thành viên của dự án nơi hoạt động diễn ra.</li>
        </ul>
      </section>
    </>
  );
};

export default ProfileSettings;
