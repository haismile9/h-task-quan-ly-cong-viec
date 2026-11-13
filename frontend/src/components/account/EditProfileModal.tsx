import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../api/auth";
import { getErrorMessage, getFieldErrors } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";
import FormField from "../ui/FormField";
import { useToast } from "../ui/Toast";

/** Modal sửa hồ sơ: đổi họ tên (email không đổi được). */
const EditProfileModal = ({ onClose }: { onClose: () => void }) => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateProfile({ name: name.trim() }),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Đã cập nhật hồ sơ");
      onClose();
    },
  });
  const errors = getFieldErrors(updateProfile.error);

  if (!user) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    updateProfile.mutate();
  };

  return (
    <Modal title="Sửa hồ sơ" size="sm" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormField
          label="Họ tên"
          value={name}
          maxLength={100}
          autoComplete="name"
          onChange={(e) => setName(e.target.value)}
          errors={errors.name}
          autoFocus
        />
        <FormField label="Email" value={user.email} disabled />
        <p className="text-xs text-base-content/60">Email dùng để đăng nhập nên không thay đổi được.</p>
        {updateProfile.isError && !Object.keys(errors).length && (
          <p className="text-error text-sm">{getErrorMessage(updateProfile.error)}</p>
        )}
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim() || name.trim() === user.name || updateProfile.isPending}
          >
            {updateProfile.isPending && <span className="loading loading-spinner loading-sm" />}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;
