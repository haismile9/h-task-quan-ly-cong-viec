/**
 * Nền của dự án, lưu trong cột `background_url`:
 *   - "gradient:<id>"      → một gradient màu bên dưới
 *   - URL ảnh (http/https) → ảnh người dùng tải lên, phủ kín
 *   - "/img/undraw_..."    → ảnh minh hoạ cũ: quy về một gradient cố định cho đẹp
 */
export const BOARD_GRADIENTS = [
  // Các id cũ giữ nguyên để dự án đã tạo không đổi màu
  { id: "blue", label: "Xanh dương", css: "linear-gradient(135deg, #0c66e4 0%, #1d7afc 55%, #579dff 100%)" },
  { id: "ocean", label: "Đại dương", css: "linear-gradient(135deg, #0055cc 0%, #0c66e4 50%, #22a6d6 100%)" },
  { id: "sky", label: "Bầu trời", css: "linear-gradient(135deg, #1d7afc 0%, #579dff 50%, #85b8ff 100%)" },
  { id: "navy", label: "Xanh đậm", css: "linear-gradient(135deg, #09326c 0%, #0055cc 60%, #1d7afc 100%)" },
  { id: "teal", label: "Ngọc lam", css: "linear-gradient(135deg, #0c66e4 0%, #1f9bb4 60%, #4bce97 100%)" },
  { id: "indigo", label: "Chàm", css: "linear-gradient(135deg, #352c63 0%, #0c66e4 60%, #579dff 100%)" },
  // Màu mới
  { id: "purple", label: "Tím", css: "linear-gradient(135deg, #6e5dc6 0%, #9f8fef 100%)" },
  { id: "pink", label: "Hồng", css: "linear-gradient(135deg, #7f5fd8 0%, #e774bb 100%)" },
  { id: "dusk", label: "Hoàng hôn", css: "linear-gradient(135deg, #1c2b41 0%, #943d73 100%)" },
  { id: "sunset", label: "Cam", css: "linear-gradient(135deg, #e2483d 0%, #faa53d 100%)" },
  { id: "red", label: "Đỏ", css: "linear-gradient(135deg, #ae2e24 0%, #f87168 100%)" },
  { id: "green", label: "Xanh lá", css: "linear-gradient(135deg, #216e4e 0%, #4bce97 100%)" },
  { id: "lime", label: "Lá non", css: "linear-gradient(135deg, #4c6b1f 0%, #94c748 100%)" },
  { id: "slate", label: "Xám đậm", css: "linear-gradient(135deg, #1d2125 0%, #44546f 100%)" },
  { id: "light", label: "Xanh nhạt", css: "linear-gradient(135deg, #cce0ff 0%, #e9f2ff 100%)" },
] as const;

export const DEFAULT_BACKGROUND = "gradient:blue";

const hash = (s: string) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
};

export const isImageBackground = (value?: string | null): value is string =>
  !!value && /^https?:\/\//.test(value);

/** CSS `background` cho một giá trị background_url. */
export const backgroundCss = (value?: string | null): string => {
  if (!value) return BOARD_GRADIENTS[0].css;
  if (value.startsWith("gradient:")) {
    const id = value.slice("gradient:".length);
    return (BOARD_GRADIENTS.find((g) => g.id === id) ?? BOARD_GRADIENTS[0]).css;
  }
  if (isImageBackground(value)) return `#1d2125 url("${value}") center / cover no-repeat`;
  // Ảnh minh hoạ cũ: chọn cố định trong 6 gradient xanh ban đầu
  return BOARD_GRADIENTS[hash(value) % 6].css;
};

/** Nền toàn trang bảng. */
export const boardPageBackground = backgroundCss;
