import type { ReactNode } from "react";

interface PageProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Nút hành động bên phải tiêu đề. */
  actions?: ReactNode;
  children: ReactNode;
}

/** Khung nội dung cho các trang có menu trái (tiêu đề thống nhất). */
const Page = ({ title, subtitle, actions, children }: PageProps) => (
  <div className="w-full max-w-5xl px-4 sm:px-6 py-6">
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-base-content/60 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

/** Tiêu đề một nhóm trong trang (vd. "Đã xem gần đây"). */
export const Section = ({ icon, title, children }: { icon?: ReactNode; title: ReactNode; children: ReactNode }) => (
  <section className="mb-10">
    <h2 className="flex items-center gap-2 font-bold mb-4">
      {icon && <span className="text-xl text-base-content/70">{icon}</span>}
      {title}
    </h2>
    {children}
  </section>
);

export default Page;
