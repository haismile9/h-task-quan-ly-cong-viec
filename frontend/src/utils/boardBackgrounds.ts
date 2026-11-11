/**
 * Nền của dự án, lưu trong cột `background_url` dạng "gradient:<id>".
 * Dữ liệu cũ (đường dẫn ảnh minh hoạ) được quy về một gradient cố định theo chuỗi đó,
 * để mọi bảng giữ cùng tông trắng–xanh.
 */
export const BOARD_GRADIENTS = [
  { id: "blue", label: "Xanh dương", css: "linear-gradient(135deg, #0c66e4 0%, #1d7afc 55%, #579dff 100%)" },
  { id: "ocean", label: "Đại dương", css: "linear-gradient(135deg, #0055cc 0%, #0c66e4 50%, #22a6d6 100%)" },
  { id: "sky", label: "Bầu trời", css: "linear-gradient(135deg, #1d7afc 0%, #579dff 50%, #85b8ff 100%)" },
  { id: "navy", label: "Xanh đậm", css: "linear-gradient(135deg, #09326c 0%, #0055cc 60%, #1d7afc 100%)" },
  { id: "teal", label: "Ngọc lam", css: "linear-gradient(135deg, #0c66e4 0%, #1f9bb4 60%, #4bce97 100%)" },
  { id: "indigo", label: "Chàm", css: "linear-gradient(135deg, #352c63 0%, #0c66e4 60%, #579dff 100%)" },
] as const;

export const DEFAULT_BACKGROUND = "gradient:blue";

const hash = (s: string) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
};

/** CSS `background` cho một giá trị background_url. */
export const backgroundCss = (value?: string | null): string => {
  if (!value) return BOARD_GRADIENTS[0].css;
  if (value.startsWith("gradient:")) {
    const id = value.slice("gradient:".length);
    return (BOARD_GRADIENTS.find((g) => g.id === id) ?? BOARD_GRADIENTS[0]).css;
  }
  return BOARD_GRADIENTS[hash(value) % BOARD_GRADIENTS.length].css;
};

/** Nền toàn trang bảng. */
export const boardPageBackground = backgroundCss;
