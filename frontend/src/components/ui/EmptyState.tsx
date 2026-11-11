import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Trạng thái "chưa có dữ liệu" dùng chung cho các danh sách. */
const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
    {icon && <div className="text-5xl text-base-content/30 mb-2">{icon}</div>}
    <p className="text-lg text-base-content/70">{title}</p>
    {description && <p className="text-sm text-base-content/50">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export default EmptyState;
