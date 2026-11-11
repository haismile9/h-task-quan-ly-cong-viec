import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi, type TaskInput } from "../api/tasks";
import type { Task } from "../types";

export const taskKeys = {
  byProject: (projectId: number) => ["projects", projectId, "tasks"] as const,
  mine: ["my-tasks"] as const,
};

export const useProjectTasks = (projectId: number) =>
  useQuery({ queryKey: taskKeys.byProject(projectId), queryFn: () => tasksApi.listByProject(projectId) });

export const useMyTasks = () => useQuery({ queryKey: taskKeys.mine, queryFn: tasksApi.mine });

/** Làm mới mọi nơi hiển thị task của dự án sau khi thay đổi. */
const useInvalidateTasks = (projectId: number) => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: taskKeys.byProject(projectId) });
    qc.invalidateQueries({ queryKey: taskKeys.mine });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
};

export const useCreateTask = (projectId: number) => {
  const invalidate = useInvalidateTasks(projectId);
  return useMutation({
    mutationFn: (input: TaskInput & { title: string }) => tasksApi.create(projectId, input),
    onSuccess: invalidate,
  });
};

export const useUpdateTask = (projectId: number) => {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks(projectId);
  const key = taskKeys.byProject(projectId);

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TaskInput }) => tasksApi.update(id, input),
    // Cập nhật lạc quan để kéo thả không bị giật; hoàn tác nếu API lỗi.
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Task[]>(key);
      qc.setQueryData<Task[]>(key, (tasks) =>
        tasks?.map((t) => (t.id === id ? ({ ...t, ...input } as Task) : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: invalidate,
  });
};

export const useDeleteTask = (projectId: number) => {
  const invalidate = useInvalidateTasks(projectId);
  return useMutation({ mutationFn: (id: number) => tasksApi.remove(id), onSuccess: invalidate });
};
