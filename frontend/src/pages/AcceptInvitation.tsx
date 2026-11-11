import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AiFillCheckCircle, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { invitationsApi } from "../api/invitations";
import { getErrorMessage, getFieldErrors } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import OtpInput from "../components/ui/OtpInput";
import { maskEmail } from "../utils/maskEmail";
import { backgroundCss } from "../utils/boardBackgrounds";
import type { FieldErrors } from "../types";

type Step = "intro" | "code" | "profile";
const RESEND_SECONDS = 30;

/**
 * Trang mở từ email mời: xác minh email bằng mã 6 số rồi tạo tài khoản (họ tên + mật khẩu).
 * Tạo xong là thành viên của dự án và được đưa thẳng vào bảng.
 */
const AcceptInvitation = () => {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { token: authToken, user, login } = useAuth();
  const { data: invite, isLoading, error } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => invitationsApi.get(token),
    retry: false,
  });

  const [step, setStep] = useState<Step>("intro");
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

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await action();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      await invitationsApi.sendCode(token);
      setStep("code");
      setCode("");
      setCooldown(RESEND_SECONDS);
      setMessage({ type: "success", text: "Đã gửi mã. Hãy kiểm tra hộp thư (cả mục Spam)." });
    });

  const verifyCode = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await invitationsApi.verifyCode(token, code);
      setStep("profile");
    });
  };

  const finish = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await invitationsApi.accept(token, { code, name: name.trim(), password });
      await login(res.token, res.user);
      navigate(`/projects/${res.project_id}`, { replace: true });
    });
  };

  if (isLoading) {
    return (
      <AuthLayout title="Đang mở lời mời…">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (error || !invite) {
    return (
      <AuthLayout
        title="Lời mời không còn hiệu lực"
        subtitle={getErrorMessage(error, "Lời mời không tồn tại hoặc đã bị huỷ.")}
        footer={<Link to="/login" className="link link-primary">Đến trang đăng nhập</Link>}
      >
        <p className="text-sm text-center text-base-content/60">Hãy nhờ chủ dự án gửi lại lời mời.</p>
      </AuthLayout>
    );
  }

  const projectCard = (
    <div className="rounded-lg overflow-hidden border border-base-300 mb-5">
      <div className="h-14" style={{ background: backgroundCss(invite.project.background_url) }} />
      <div className="px-3 py-2 text-sm">
        <span className="font-semibold">{invite.inviter_name ?? "Một thành viên"}</span> mời bạn vào dự án{" "}
        <span className="font-semibold text-primary">{invite.project.name}</span>
      </div>
    </div>
  );

  // Email đã có tài khoản (hoặc lời mời đã dùng): chỉ cần đăng nhập.
  if (invite.has_account || invite.accepted) {
    const signedInAsInvitee = !!authToken && user?.email === invite.email;
    return (
      <AuthLayout title="Bạn đã có tài khoản" subtitle={<>Lời mời dành cho <b>{invite.email}</b></>}>
        {projectCard}
        {signedInAsInvitee ? (
          <Link to={`/projects/${invite.project.id}`} className="btn btn-primary w-full">
            Mở dự án
          </Link>
        ) : (
          <Link
            to="/login"
            state={{ from: { pathname: `/projects/${invite.project.id}` } }}
            className="btn btn-primary w-full"
          >
            Đăng nhập để vào dự án
          </Link>
        )}
      </AuthLayout>
    );
  }

  const alert = message && (
    <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"} text-sm`}>{message.text}</div>
  );

  if (step === "intro") {
    return (
      <AuthLayout
        title="Chúng tôi cần xác minh email của bạn"
        subtitle="Vui lòng nhấn nút bên dưới rồi kiểm tra hộp thư đến của bạn."
      >
        {projectCard}
        <p className="text-center font-semibold mb-5">{maskEmail(invite.email)}</p>
        <div className="space-y-3">
          {alert}
          <button className="btn btn-primary w-full" onClick={sendCode} disabled={busy}>
            {busy && <span className="loading loading-spinner loading-sm" />}
            Gửi mã xác minh qua email
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (step === "code") {
    return (
      <AuthLayout
        title="Chúng tôi đã gửi cho bạn một mã qua email"
        subtitle={
          <>
            Để hoàn tất thiết lập tài khoản, hãy nhập mã đã gửi đến:
            <br />
            <span className="font-semibold text-base-content">{maskEmail(invite.email)}</span>
          </>
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
          <button
            type="button"
            className="btn btn-link btn-sm w-full no-underline"
            onClick={sendCode}
            disabled={busy || cooldown > 0}
          >
            {cooldown > 0 ? `Gửi lại email sau ${cooldown}s` : "Bạn không nhận được email? Gửi lại email"}
          </button>
        </form>
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
          <p>{invite.email}</p>
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
          Tiếp tục
        </button>
      </form>
    </AuthLayout>
  );
};

export default AcceptInvitation;
