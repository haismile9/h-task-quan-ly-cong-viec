/** 12 màu khác sắc độ rõ rệt, đủ đậm để chữ trắng dễ đọc. */
const PALETTE = [
  "#0c66e4", // xanh dương
  "#1f845a", // xanh lá
  "#c9372c", // đỏ
  "#6e5dc6", // tím
  "#b65c02", // cam
  "#227d9b", // xanh ngọc
  "#ae4787", // hồng đậm
  "#5b7f24", // xanh rêu
  "#4f46e5", // chàm
  "#8f5b3a", // nâu
  "#d6336c", // hồng
  "#44546f", // xám xanh
];

/** Màu cố định theo tên (băm FNV-1a để tên ngắn/giống nhau vẫn phân tán đều). */
const colorFor = (name: string) => {
  let hash = 0x811c9dc5;
  for (const ch of name.trim().toLowerCase()) {
    hash ^= ch.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return PALETTE[(hash >>> 0) % PALETTE.length];
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
