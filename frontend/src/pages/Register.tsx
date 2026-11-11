import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { getErrorMessage, getFieldErrors } from "../api/client";
import AuthLayout from "../components/auth/AuthLayout";
import FormField from "../components/ui/FormField";
import type { FieldErrors } from "../types";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setLoading(true);
    try {
      await authApi.register({ name, email, password, password_confirmation: passwordConfirmation });
      // Backend đã lưu thông tin chờ xác minh; trang xác minh chỉ cần email.
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) setGeneralError(getErrorMessage(err, "Đăng ký thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Bắt đầu quản lý công việc cùng nhóm của bạn"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="link link-primary font-semibold">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <FormField label="Họ tên" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} errors={errors.name} autoFocus />
        <FormField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} errors={errors.email} />
        <FormField
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          placeholder="Ít nhất 6 ký tự"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errors={errors.password}
        />
        <FormField
          label="Xác nhận mật khẩu"
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
        />
        {generalError && <div className="alert alert-error text-sm">{generalError}</div>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Đăng ký
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
