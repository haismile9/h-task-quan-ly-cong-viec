import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiFillCheckCircle, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { authApi } from "../api/auth";
import { getErrorMessage, getFieldErrors } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import OtpInput from "../components/ui/OtpInput";
import { maskEmail } from "../utils/maskEmail";
import type { FieldErrors } from "../types";

type Step = "email" | "code" | "profile" | "setup";
const RESEND_SECONDS = 30;

/**
 * Đăng ký như Trello: email → mã 6 số → họ tên + mật khẩu
 * → "Đang thiết lập tài khoản" (server tạo tài khoản + bảng mẫu) → mở thẳng bảng mẫu.
 */
const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const run = async (action: () => Promise<void>, onError?: () => void) => {
    setBusy(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await action();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setMessage({ type: "error", text: getErrorMessage(err) });
      onError?.();
    } finally {
      setBusy(false);
    }
  };

  const start = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await authApi.signupStart(email.trim());
      setCooldown(RESEND_SECONDS);
      setStep("code");
    });
  };

  const resend = () =>
    run(async () => {
      await authApi.signupStart(email.trim());
      setCode("");
      setCooldown(RESEND_SECONDS);
      setMessage({ type: "success", text: "Đã gửi lại mã. Hãy kiểm tra hộp thư (cả mục Spam)." });
    });

  const verifyCode = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await authApi.signupVerifyCode(email.trim(), code);
      setStep("profile");
    });
  };

  const finish = (e: FormEvent) => {
    e.preventDefault();
    setStep("setup");
    run(
      async () => {
        // Giữ màn hình "Đang thiết lập" tối thiểu một chút cho khỏi chớp
        const [res] = await Promise.all([
          authApi.signupComplete({ email: email.trim(), code, name: name.trim(), password }),
          new Promise((r) => setTimeout(r, 1200)),
        ]);
        await login(res.token, res.user);
        navigate(`/projects/${res.project_id}`, { replace: true });
      },
      () => setStep("profile"),
    );
  };

  const alert = message && (
    <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"} text-sm`}>{message.text}</div>
  );
  const loginFooter = (
    <>
      Đã có tài khoản?{" "}
      <Link to="/login" className="link link-primary font-semibold">
        Đăng nhập
      </Link>
    </>
  );

  if (step === "email") {
    return (
      <AuthLayout title="Đăng ký để tiếp tục" subtitle="Miễn phí. Bắt đầu quản lý công việc cùng nhóm của bạn." footer={loginFooter}>
        <form onSubmit={start} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Email</span>
            <input
              type="email"
              className={`input input-bordered w-full ${fieldErrors.email ? "input-error" : ""}`}
              placeholder="Nhập email của bạn"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {fieldErrors.email?.map((m) => <span key={m} className="text-error text-xs">{m}</span>)}
          </label>
          {message && !fieldErrors.email && alert}
          <button type="submit" className="btn btn-primary w-full" disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())}>
            {busy && <span className="loading loading-spinner loading-sm" />}
            Tiếp tục
          </button>
        </form>
      </AuthLayout>
    );
  }

  if (step === "code") {
    return (
      <AuthLayout
        title="Chúng tôi đã gửi cho bạn một mã qua email"
        subtitle={
          <>
            Để tiếp tục, hãy nhập mã đã gửi đến:
            <br />
            <span className="font-semibold text-base-content">{maskEmail(email.trim())}</span>
          </>
        }
        footer={
          <button className="link link-primary" onClick={() => setStep("email")}>
            Dùng email khác
          </button>
        }
      >
        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <p className="text-xs font-semibold mb-2">Mã xác minh</p>
            <OtpInput value={code} onChange={setCode} autoFocus invalid={message?.type === "error"} />
          </div>
          {alert}
          <button type="submit" className="btn btn-primary w-full" disabled={busy || code.length !== 6}>
            {busy && <span className="loading loading-spinner loading-sm" />}
            Xác minh
          </button>
          <button type="button" className="btn btn-link btn-sm w-full no-underline" onClick={resend} disabled={busy || cooldown > 0}>
            {cooldown > 0 ? `Gửi lại email sau ${cooldown}s` : "Bạn không nhận được email? Gửi lại email"}
          </button>
        </form>
      </AuthLayout>
    );
  }

  if (step === "setup") {
    return (
      <AuthLayout title="Đang thiết lập tài khoản…" subtitle="Chúng tôi đang tạo tài khoản và bảng đầu tiên cho bạn.">
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Hoàn tất thiết lập tài khoản">
      <form onSubmit={finish} className="space-y-4">
        <div className="text-sm">
          <p className="font-semibold flex items-center gap-1">
            Địa chỉ email <AiFillCheckCircle className="text-success" title="Đã xác minh" />
          </p>
          <p>{email.trim()}</p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">
            Họ tên <span className="text-error">*</span>
          </span>
          <input
            className={`input input-bordered w-full ${fieldErrors.name ? "input-error" : ""}`}
            placeholder="Nhập họ tên"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {fieldErrors.name?.map((m) => <span key={m} className="text-error text-xs">{m}</span>)}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">
            Mật khẩu <span className="text-error">*</span>
          </span>
          {/* username ẩn giúp trình duyệt lưu mật khẩu đúng email */}
          <input type="email" autoComplete="username" value={email.trim()} readOnly hidden />
          <div className={`input input-bordered w-full flex items-center gap-2 ${fieldErrors.password ? "input-error" : ""}`}>
            <input
              type={showPassword ? "text" : "password"}
              className="grow"
              placeholder="Tạo mật khẩu"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="text-base-content/60"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
            </button>
          </div>
          <progress
            className={`progress h-1 ${password.length >= 12 ? "progress-success" : password.length >= 8 ? "progress-primary" : "progress-warning"}`}
            value={Math.min(password.length, 12)}
            max={12}
          />
          <span className="text-xs text-base-content/60 text-center">Mật khẩu phải gồm ít nhất 8 ký tự</span>
          {fieldErrors.password?.map((m) => <span key={m} className="text-error text-xs">{m}</span>)}
        </label>
        {message?.type === "error" && !Object.keys(fieldErrors).length && alert}
        <button type="submit" className="btn btn-primary w-full" disabled={busy || !name.trim() || password.length < 8}>
          {busy && <span className="loading loading-spinner loading-sm" />}
          Tạo tài khoản
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
