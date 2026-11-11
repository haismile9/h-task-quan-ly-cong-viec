import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { authApi } from "../../api/auth";
import { getErrorMessage, getFieldErrors } from "../../api/client";
import Modal from "../ui/Modal";
import FormField from "../ui/FormField";
import { useToast } from "../ui/Toast";

/** Modal đổi mật khẩu: mật khẩu hiện tại + mật khẩu mới (≥ 8 ký tự) + xác nhận. */
const ChangePasswordModal = ({ onClose }: { onClose: () => void }) => {
  const toast = useToast();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(form),
    onSuccess: () => {
      toast.success("Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất.");
      onClose();
    },
  });
  const errors = getFieldErrors(changePassword.error);
  const mismatch = form.password_confirmation.length > 0 && form.password !== form.password_confirmation;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    changePassword.mutate();
  };

  const type = show ? "text" : "password";

  return (
    <Modal title="Đổi mật khẩu" size="sm" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormField
          label="Mật khẩu hiện tại"
          type={type}
          autoComplete="current-password"
          value={form.current_password}
          onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          errors={errors.current_password}
          autoFocus
        />
        <FormField
          label="Mật khẩu mới"
          type={type}
          autoComplete="new-password"
          placeholder="Ít nhất 8 ký tự"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          errors={errors.password}
        />
        <FormField
          label="Xác nhận mật khẩu mới"
          type={type}
          autoComplete="new-password"
          value={form.password_confirmation}
          onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          errors={mismatch ? ["Mật khẩu xác nhận không khớp"] : undefined}
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
          <input type="checkbox" className="checkbox checkbox-sm" checked={show} onChange={(e) => setShow(e.target.checked)} />
          {show ? <AiOutlineEyeInvisible /> : <AiOutlineEye />} Hiện mật khẩu
        </label>
        <p className="text-xs text-base-content/60">Sau khi đổi, bạn vẫn đăng nhập ở đây; các thiết bị khác sẽ phải đăng nhập lại.</p>
        {changePassword.isError && !Object.keys(errors).length && (
          <p className="text-error text-sm">{getErrorMessage(changePassword.error)}</p>
        )}
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!form.current_password || form.password.length < 8 || mismatch || changePassword.isPending}
          >
            {changePassword.isPending && <span className="loading loading-spinner loading-sm" />}
            Đổi mật khẩu
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
