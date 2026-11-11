import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";

const KEY = ["backgrounds"] as const;

/** Ảnh nền bạn đã tải lên (URL), mới nhất trước. */
export const useMyBackgrounds = () =>
  useQuery({ queryKey: KEY, queryFn: () => client.get<string[]>("/backgrounds").then((r) => r.data) });

export const useUploadBackground = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("image", file);
      // client mặc định gửi JSON: đặt rõ multipart để axios không chuyển FormData thành JSON
      return client
        .post<{ url: string }>("/backgrounds", form, { headers: { "Content-Type": "multipart/form-data" } })
        .then((r) => r.data.url);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
