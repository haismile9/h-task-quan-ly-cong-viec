import { useInfiniteQuery } from "@tanstack/react-query";
import client, { getStatus } from "../api/client";

export interface UnsplashPhoto {
  id: string;
  thumb: string;
  /** URL ảnh dùng làm nền (lưu vào background_url). */
  full: string;
  color: string | null;
  alt: string | null;
  author: string;
  author_url: string;
  download_location: string | null;
}

interface UnsplashPage {
  results: UnsplashPhoto[];
  total_pages: number;
  page: number;
}

/** Ảnh Unsplash theo từ khoá (rỗng = ảnh phong cảnh mặc định), tải thêm theo trang. */
export const useUnsplashPhotos = (query: string) =>
  useInfiniteQuery({
    queryKey: ["unsplash", query.trim().toLowerCase()],
    queryFn: ({ pageParam }) =>
      client
        .get<UnsplashPage>("/unsplash/photos", { params: { query: query.trim() || undefined, page: pageParam } })
        .then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    staleTime: 30 * 60 * 1000,
    // Chưa cấu hình key (503) thì không thử lại
    retry: (count, err) => getStatus(err) !== 503 && count < 1,
  });

/** Báo cho Unsplash biết ảnh đã được chọn (theo hướng dẫn API); lỗi thì bỏ qua. */
export const trackUnsplashDownload = (photo: UnsplashPhoto) => {
  if (photo.download_location) {
    client.post("/unsplash/download", { download_location: photo.download_location }).catch(() => undefined);
  }
};
