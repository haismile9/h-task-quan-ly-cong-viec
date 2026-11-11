import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const VerifyEmailForm = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const email: string | undefined = state?.email;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!email) return <Navigate to="/register" replace />;

  const handleVerify = async () => {
    try {
      setError("");
      const { token, user } = await authApi.verifyEmail(email, code.trim());
      await login(token, user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setSuccess("");
      setError(getErrorMessage(err, "Xác minh thất bại."));
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
    <div className="h-screen flex justify-center items-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">🔐 Xác minh Email</h2>

          <input
            value={email}
            disabled
            className="input input-bordered mb-2 bg-gray-100"
          />

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã xác minh"
            className="input input-bordered mb-2"
          />

          {error && <p className="text-error text-sm">{error}</p>}
          {success && <p className="text-success text-sm">{success}</p>}

          <button className="btn btn-primary w-full" onClick={handleVerify}>
            Xác minh
          </button>
          <button className="btn btn-link mt-2" onClick={handleResend}>
            Gửi lại mã
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailForm;
