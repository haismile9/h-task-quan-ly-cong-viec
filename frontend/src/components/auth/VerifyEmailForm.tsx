import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "./AuthLayout";

const VerifyEmailForm = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const email: string | undefined = state?.email;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) return <Navigate to="/register" replace />;

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await authApi.verifyEmail(email, code.trim());
      await login(token, user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setSuccess("");
      setError(getErrorMessage(err, "Xác minh thất bại."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setError("");
      await authApi.resendCode(email);
      setSuccess("Đã gửi lại mã xác minh.");
    } catch (err) {
      setSuccess("");
      setError(getErrorMessage(err, "Không thể gửi lại mã."));
    }
  };

  return (
    <AuthLayout
      title="Xác minh email"
      subtitle={
        <>
          Nhập mã đã gửi tới <span className="font-semibold text-base-content">{email}</span>
        </>
      }
      footer={
        <Link to="/register" className="link link-primary">
          Dùng email khác
        </Link>
      }
    >
      <form onSubmit={handleVerify} className="space-y-4">
        <input
          className="input input-bordered w-full text-center text-2xl tracking-[0.5em]"
          placeholder="••••••"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          aria-label="Mã xác minh"
          autoFocus
        />
        {error && <div className="alert alert-error text-sm">{error}</div>}
        {success && <div className="alert alert-success text-sm">{success}</div>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading || !code}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Xác minh
        </button>
        <button type="button" className="btn btn-ghost btn-sm w-full" onClick={handleResend}>
          Gửi lại mã
        </button>
      </form>
    </AuthLayout>
  );
};

export default VerifyEmailForm;
