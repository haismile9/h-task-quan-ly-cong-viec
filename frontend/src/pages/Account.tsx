import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

const Account = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateProfile({ name: name.trim() }),
    onSuccess: setUser,
  });

  if (!user) return null;

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Tài khoản của tôi</h1>

      <div className="space-y-4 bg-base-100 p-6 rounded shadow w-full max-w-lg">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="text" disabled value={user.email} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Tên</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <button
          onClick={() => updateProfile.mutate()}
          className="btn btn-primary w-full"
          disabled={!name.trim() || updateProfile.isPending}
        >
          Cập nhật
        </button>
        {updateProfile.isSuccess && <p className="text-sm text-success">Cập nhật thành công</p>}
        {updateProfile.isError && <p className="text-sm text-error">{getErrorMessage(updateProfile.error)}</p>}
      </div>
    </div>
  );
};

export default Account;
