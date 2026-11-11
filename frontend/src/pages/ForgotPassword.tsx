import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { getErrorMessage, getFieldErrors } from "../api/client";
import AuthLayout from "../components/auth/AuthLayout";
import FormField from "../components/ui/FormField";
import OtpInput from "../components/ui/OtpInput";
import type { FieldErrors } from "../types";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập mã, 3: Đặt mật khẩu mới
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút = 600 giây
  const navigate = useNavigate();

  // Đếm ngược thời gian
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  // Format thời gian mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    try {
      setErrors({});
      setGeneralError("");
      setLoading(true);
      
      await authApi.sendResetCode(email);
      
      setStep(2);
      setTimeLeft(600); // Reset timer
      setCode(""); // Reset code
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) setGeneralError(getErrorMessage(err, "Gửi mã thất bại"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setGeneralError("");
      setLoading(true);
      
      await authApi.sendResetCode(email);
      
      setTimeLeft(600); // Reset timer
      setCode(""); // Reset code
      setGeneralError("");
    } catch (err) {
      setGeneralError(getErrorMessage(err, "Gửi lại mã thất bại"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setErrors({});
      setGeneralError("");
      setLoading(true);
      
      await authApi.verifyResetCode(email, code.trim());
      setStep(3);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setGeneralError(getErrorMessage(err, "Mã không hợp lệ hoặc đã hết hạn"));
      // Không reset code khi lỗi để user có thể thử lại
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setErrors({});
      setGeneralError("");
      setLoading(true);
      
      await authApi.resetPassword({
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate("/login", {
        replace: true,
        state: { message: "Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới." },
      });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) setGeneralError(getErrorMessage(err, "Đặt lại mật khẩu thất bại"));
    } finally {
      setLoading(false);
    }
  };

  /** Bọc handler để form gửi được bằng phím Enter. */
  const submit = (handler: () => void) => (e: FormEvent) => {
    e.preventDefault();
    handler();
  };

  const errorAlert = generalError && <div className="alert alert-error text-sm">{generalError}</div>;

  const steps = {
    1: {
      title: "Quên mật khẩu",
      subtitle: "Nhập email để nhận mã đặt lại mật khẩu",
      body: (
        <form onSubmit={submit(handleSendCode)} className="space-y-4">
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            errors={errors.email}
            autoFocus
          />
          {errorAlert}
          <button type="submit" className="btn btn-primary w-full" disabled={loading || !email}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            Gửi mã
          </button>
        </form>
      ),
    },
    2: {
      title: "Nhập mã xác thực",
      subtitle: (
        <>
          Mã đã được gửi tới <span className="font-semibold text-base-content">{email}</span>
        </>
      ),
      body: (
        <form onSubmit={submit(handleVerifyCode)} className="space-y-4">
          <OtpInput value={code} onChange={setCode} autoFocus invalid={!!generalError} />
          <p className="text-xs text-center text-base-content/60">
            {timeLeft > 0 ? (
              <>
                Mã hết hạn sau <span className="font-semibold text-primary">{formatTime(timeLeft)}</span>
              </>
            ) : (
              "Mã đã hết hạn, hãy gửi lại mã mới."
            )}
          </p>
          {errorAlert}
          <button type="submit" className="btn btn-primary w-full" disabled={loading || code.length !== 6}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            Xác thực mã
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => setStep(1)}>
              ← Đổi email
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm flex-1"
              onClick={handleResendCode}
              disabled={loading || timeLeft > 0}
            >
              Gửi lại mã
            </button>
          </div>
        </form>
      ),
    },
    3: {
      title: "Đặt mật khẩu mới",
      subtitle: "Nhập mật khẩu mới cho tài khoản của bạn",
      body: (
        <form onSubmit={submit(handleResetPassword)} className="space-y-4">
          <FormField
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errors={errors.password}
            autoFocus
          />
          <FormField
            label="Xác nhận mật khẩu mới"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          {errorAlert}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            Đặt lại mật khẩu
          </button>
        </form>
      ),
    },
  }[step as 1 | 2 | 3];

  return (
    <AuthLayout
      title={steps.title}
      subtitle={steps.subtitle}
      footer={
        <Link to="/login" className="link link-primary">
          Quay lại đăng nhập
        </Link>
      }
    >
      <ul className="steps steps-horizontal w-full text-xs mb-6">
        <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Email</li>
        <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Mã</li>
        <li className={`step ${step >= 3 ? "step-primary" : ""}`}>Mật khẩu</li>
      </ul>
      {steps.body}
    </AuthLayout>
  );
};

export default ForgotPassword;
