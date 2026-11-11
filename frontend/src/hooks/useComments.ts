import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "../api/comments";

const commentKeys = { byTask: (taskId: number) => ["tasks", taskId, "comments"] as const };

export const useComments = (taskId: number) =>
  useQuery({ queryKey: commentKeys.byTask(taskId), queryFn: () => commentsApi.list(taskId), enabled: taskId > 0 });

export const useCreateComment = (taskId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => commentsApi.create(taskId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
  });
};

export const useDeleteComment = (taskId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => commentsApi.remove(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
  });
};
