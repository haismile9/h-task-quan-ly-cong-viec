import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { activitiesApi } from "../api/activities";

export const activityKeys = {
  mine: ["activities", "me"] as const,
  task: (taskId: number) => ["activities", "task", taskId] as const,
};

/** Hoạt động của tôi, tải thêm theo trang. */
export const useMyActivities = () =>
  useInfiniteQuery({
    queryKey: activityKeys.mine,
    queryFn: ({ pageParam }) => activitiesApi.mine(pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => (last.has_more ? last.data[last.data.length - 1]?.id : undefined),
  });

/** Hoạt động của một thẻ (trang đầu là đủ cho cột bình luận). */
export const useTaskActivities = (taskId: number) =>
  useQuery({ queryKey: activityKeys.task(taskId), queryFn: () => activitiesApi.forTask(taskId), enabled: taskId > 0 });
