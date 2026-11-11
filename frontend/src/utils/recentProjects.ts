/**
 * Danh sách dự án "Đã xem gần đây", lưu trong trình duyệt của người xem.
 * Chỉ là tiện ích hiển thị: nếu localStorage bị chặn thì trả về rỗng.
 */
const KEY = "recentProjects";
const LIMIT = 4;

export const getRecentProjectIds = (): number[] => {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
};

export const markProjectViewed = (id: number) => {
  try {
    const ids = [id, ...getRecentProjectIds().filter((x) => x !== id)].slice(0, LIMIT);
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Bỏ qua: không lưu được thì chỉ mất mục "Đã xem gần đây".
  }
};
