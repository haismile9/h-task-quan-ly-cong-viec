import { useCallback, useSyncExternalStore } from "react";

/**
 * Dự án được gắn sao, lưu trong trình duyệt của người xem (backend chưa có cột này).
 * Mọi component dùng hook này cùng cập nhật khi gắn/bỏ sao.
 */
const KEY = "starredProjects";
const listeners = new Set<() => void>();

const read = (): number[] => {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
};

let snapshot = read();

const write = (ids: number[]) => {
  snapshot = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Không lưu được (chế độ riêng tư...) thì vẫn giữ trong phiên hiện tại.
  }
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useStarredProjects = () => {
  const starred = useSyncExternalStore(subscribe, () => snapshot);
  const isStarred = useCallback((id: number) => starred.includes(id), [starred]);
  const toggleStar = useCallback(
    (id: number) => write(snapshot.includes(id) ? snapshot.filter((x) => x !== id) : [...snapshot, id]),
    []
  );
  return { starred, isStarred, toggleStar };
};
