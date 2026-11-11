import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Dòng liên kết dưới thẻ (vd. "Chưa có tài khoản? Đăng ký"). */
  footer?: ReactNode;
}

/** Khung chung cho các trang đăng nhập/đăng ký: nền xanh, thẻ trắng ở giữa. */
const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => (
  <div className="min-h-screen bg-board flex flex-col items-center justify-center p-4">
    <div className="flex items-center gap-2 text-white mb-6">
      <img src="/img/favicon-32x32.png" alt="" className="w-8 h-8 rounded" />
      <span className="text-2xl font-bold tracking-tight">H-Task</span>
    </div>

    <div className="bg-base-100 rounded-box shadow-xl w-full max-w-sm p-8">
      <h1 className="text-xl font-bold text-center">{title}</h1>
      {subtitle && <p className="text-sm text-base-content/60 text-center mt-1">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 pt-4 border-t border-base-300 text-center text-sm">{footer}</div>}
    </div>
  </div>
);

export default AuthLayout;
