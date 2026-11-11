import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { getErrorMessage, getFieldErrors } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import FormField from "../components/ui/FormField";
import type { FieldErrors } from "../types";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setLoading(true);
    try {
      const { token, user } = await authApi.login(email, password);
      await login(token, user);
      // Quay lại trang người dùng định vào trước khi bị chuyển tới /login
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) setGeneralError(getErrorMessage(err, "Đăng nhập thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay trở lại!"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/register" className="link link-primary font-semibold">
            Đăng ký
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {location.state?.message && !generalError && (
          <div className="alert alert-success text-sm">{location.state.message}</div>
        )}
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          errors={errors.email}
          autoFocus
        />
        <FormField
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errors={errors.password}
        />
        <div className="text-right -mt-2">
          <Link to="/forgot-password" className="link link-primary text-xs">
            Quên mật khẩu?
          </Link>
        </div>
        {generalError && <div className="alert alert-error text-sm">{generalError}</div>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading || !email || !password}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Đăng nhập
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
