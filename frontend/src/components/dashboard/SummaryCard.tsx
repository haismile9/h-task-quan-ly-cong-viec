import type { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  tone: "primary" | "success" | "info" | "error";
}

const toneClass = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  error: "bg-error/10 text-error",
};

/** Ô số liệu tổng quan: icon tròn màu nhạt + con số lớn. */
const SummaryCard = ({ title, value, description, icon, tone }: SummaryCardProps) => (
  <div className="bg-base-100 border border-base-300 rounded-box p-4 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${toneClass[tone]}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm text-base-content/60">{title}</p>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="text-xs text-base-content/50 truncate">{description}</p>
    </div>
  </div>
);

export default SummaryCard;
