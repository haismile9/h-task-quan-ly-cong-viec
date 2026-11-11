import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Page from "../components/ui/Page";
import Avatar from "../components/ui/Avatar";
import { useToast } from "../components/ui/Toast";

const roleLabel: Record<string, string> = { admin: "Quản trị viên", leader: "Trưởng nhóm", member: "Thành viên" };

const Account = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateProfile({ name: name.trim() }),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Đã cập nhật thông tin");
    },
  });

  if (!user) return null;

  return (
    <Page title="Tài khoản của tôi">
      <div className="bg-base-100 border border-base-300 rounded-box max-w-xl">
        <div className="flex items-center gap-4 p-6 border-b border-base-300">
          <Avatar name={user.name} size="md" className="!w-14 !h-14 !text-lg" />
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-base-content/60">{user.email}</p>
            <span className="badge badge-sm badge-primary badge-soft mt-1">{roleLabel[user.role] ?? user.role}</span>
          </div>
        </div>

        <form
          className="p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile.mutate();
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Email</span>
            <input type="email" disabled value={user.email} className="input input-bordered w-full" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Họ tên</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered w-full" />
          </label>
          {updateProfile.isError && <p className="text-sm text-error">{getErrorMessage(updateProfile.error)}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim() || name.trim() === user.name || updateProfile.isPending}
          >
            Lưu thay đổi
          </button>
        </form>
      </div>
    </Page>
  );
};

export default Account;
