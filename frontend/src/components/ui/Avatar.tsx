const PALETTE = ["#0c66e4", "#1d7afc", "#0055cc", "#22a06b", "#6e5dc6", "#e56910", "#c9372c", "#206a83"];

/** Màu cố định theo tên để mỗi người luôn có cùng một màu avatar. */
const colorFor = (name: string) => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

const sizeClass = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm" };

interface AvatarProps {
  name: string;
  size?: keyof typeof sizeClass;
  className?: string;
}

/** Avatar chữ cái đầu, dùng cho thanh điều hướng, thành viên và người được gán. */
const Avatar = ({ name, size = "md", className = "" }: AvatarProps) => (
  <span
    title={name}
    className={`inline-flex items-center justify-center rounded-full font-semibold text-white select-none ${sizeClass[size]} ${className}`}
    style={{ backgroundColor: colorFor(name) }}
  >
    {initials(name)}
  </span>
);

export default Avatar;
