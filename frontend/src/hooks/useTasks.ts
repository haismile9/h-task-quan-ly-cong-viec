import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { listsApi, tasksApi, type TaskInput } from "../api/tasks";
import type { BoardData, Task } from "../types";

export const taskKeys = {
  board: (projectId: number) => ["projects", projectId, "tasks"] as const,
  mine: ["my-tasks"] as const,
};

/** Dữ liệu bảng (danh sách + thẻ). */
export const useBoard = (projectId: number) =>
  useQuery({ queryKey: taskKeys.board(projectId), queryFn: () => tasksApi.board(projectId) });

export const useMyTasks = () => useQuery({ queryKey: taskKeys.mine, queryFn: tasksApi.mine });

/** Làm mới mọi nơi hiển thị thẻ của dự án sau khi thay đổi. */
const useInvalidateBoard = (projectId: number) => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: taskKeys.board(projectId) });
    qc.invalidateQueries({ queryKey: taskKeys.mine });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
};

/**
 * Cập nhật lạc quan dữ liệu bảng trong cache; trả về hàm hoàn tác nếu API lỗi.
 * Dùng chung cho mọi thao tác kéo thả / sửa để giao diện phản hồi ngay.
 */
const optimistic = async (qc: QueryClient, projectId: number, update: (board: BoardData) => BoardData) => {
  const key = taskKeys.board(projectId);
  await qc.cancelQueries({ queryKey: key });
  const previous = qc.getQueryData<BoardData>(key);
  if (previous) qc.setQueryData<BoardData>(key, update(previous));
  return () => {
    if (previous) qc.setQueryData(key, previous);
  };
};

const replaceTask = (board: BoardData, task: Task): BoardData => ({
  ...board,
  tasks: board.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
});

let tempId = -1;

export const useCreateTask = (projectId: number) => {
  const qc = useQueryClient();
  const invalidate = useInvalidateBoard(projectId);
  return useMutation({
    mutationFn: (input: TaskInput & { title: string; list_id?: number }) => tasksApi.create(projectId, input),
    // Hiện thẻ ngay ở cuối danh sách (id tạm), thay bằng thẻ thật khi server trả về
    onMutate: async (input) => {
      const id = tempId--;
      const undo = await optimistic(qc, projectId, (b) => {
        const listId = input.list_id ?? [...b.lists].sort((x, y) => x.position - y.position)[0]?.id;
        if (listId === undefined) return b;
        const last = Math.max(-1, ...b.tasks.filter((t) => t.list_id === listId).map((t) => t.position));
        const now = new Date().toISOString();
        const draft: Task = {
          id,
          project_id: projectId,
          list_id: listId,
          position: last + 1,
          title: input.title,
          description: input.description ?? null,
          status: input.status ?? "pending",
          priority: input.priority ?? "medium",
          deadline: input.deadline ?? null,
          created_at: now,
          updated_at: now,
          assigned_users: [],
        };
        return { ...b, tasks: [...b.tasks, draft] };
      });
      return { undo, id };
    },
    onError: (_e, _v, ctx) => ctx?.undo(),
    onSuccess: (saved, _v, ctx) =>
      qc.setQueryData<BoardData>(taskKeys.board(projectId), (b) =>
        b ? { ...b, tasks: b.tasks.map((t) => (t.id === ctx?.id ? saved : t)) } : b
      ),
    onSettled: invalidate,
  });
};

export const useUpdateTask = (projectId: number) => {
  const qc = useQueryClient();
  const invalidate = useInvalidateBoard(projectId);
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TaskInput }) => tasksApi.update(id, input),
    onMutate: async ({ id, input }) => ({
      undo: await optimistic(qc, projectId, (b) => ({
        ...b,
        tasks: b.tasks.map((t) => (t.id === id ? ({ ...t, ...input } as Task) : t)),
      })),
    }),
    onError: (_e, _v, ctx) => ctx?.undo(),
    // Dùng ngay bản thẻ server trả về (vd. assigned_users mới) trước khi tải lại
    onSuccess: (saved) =>
      qc.setQueryData<BoardData>(taskKeys.board(projectId), (b) => (b ? replaceTask(b, saved) : b)),
    onSettled: invalidate,
  });
};

/** Kéo thẻ: chuyển sang danh sách listId tại vị trí index (theo thứ tự hiển thị). */
export const useMoveTask = (projectId: number) => {
  const qc = useQueryClient();
  const invalidate = useInvalidateBoard(projectId);
  return useMutation({
    mutationFn: ({ id, listId, index }: { id: number; listId: number; index: number }) =>
      tasksApi.move(id, listId, index),
    onMutate: async ({ id, listId, index }) => ({
      undo: await optimistic(qc, projectId, (b) => {
        const moving = b.tasks.find((t) => t.id === id);
        if (!moving) return b;
        // Thứ tự mới của danh sách đích, rồi đánh lại position cho danh sách đích và danh sách cũ
        const target = b.tasks
          .filter((t) => t.list_id === listId && t.id !== id)
          .sort((x, y) => x.position - y.position);
        target.splice(index, 0, { ...moving, list_id: listId });
        const positions = new Map<number, { list_id: number; position: number }>();
        target.forEach((t, i) => positions.set(t.id, { list_id: listId, position: i }));
        if (moving.list_id !== listId) {
          b.tasks
            .filter((t) => t.list_id === moving.list_id && t.id !== id)
            .sort((x, y) => x.position - y.position)
            .forEach((t, i) => positions.set(t.id, { list_id: t.list_id, position: i }));
        }
        return { ...b, tasks: b.tasks.map((t) => (positions.has(t.id) ? { ...t, ...positions.get(t.id)! } : t)) };
      }),
    }),
    onError: (_e, _v, ctx) => ctx?.undo(),
    onSettled: invalidate,
  });
};

export const useDeleteTask = (projectId: number) => {
  const qc = useQueryClient();
  const invalidate = useInvalidateBoard(projectId);
  return useMutation({
    mutationFn: (id: number) => tasksApi.remove(id),
    onMutate: async (id) => ({
      undo: await optimistic(qc, projectId, (b) => ({ ...b, tasks: b.tasks.filter((t) => t.id !== id) })),
    }),
    onError: (_e, _v, ctx) => ctx?.undo(),
    onSettled: invalidate,
  });
};

// ----- Danh sách (cột) -----

export const useCreateList = (projectId: number) => {
  const invalidate = useInvalidateBoard(projectId);
  return useMutation({ mutationFn: (name: string) => listsApi.create(projectId, name), onSuccess: invalidate });
};

export const useRenameList = (projectId: number) => {
  const qc = useQueryClient();
  const invalidate = useInvalidateBoard(projectId);
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => listsApi.rename(id, name),
    onMutate: async ({ id, name }) => ({
      undo: await optimistic(qc, projectId, (b) => ({
        ...b,
        lists: b.lists.map((l) => (l.id === id ? { ...l, name } : l)),
      })),
    }),
    onError: (_e, _v, ctx) => ctx?.undo(),
    onSettled: invalidate,
  });
};

export const useDeleteList = (projectId: number) => {
  const qc = useQueryClient();
  const invalidate = useInvalidateBoard(projectId);
  return useMutation({
    mutationFn: (id: number) => listsApi.remove(id),
    // Ẩn ngay danh sách và các thẻ của nó; hoàn tác nếu server từ chối
    onMutate: async (id) => ({
      undo: await optimistic(qc, projectId, (b) => ({
        lists: b.lists.filter((l) => l.id !== id),
        tasks: b.tasks.filter((t) => t.list_id !== id),
      })),
    }),
    onError: (_e, _v, ctx) => ctx?.undo(),
    onSettled: invalidate,
  });
};

/** Kéo cột: ids là thứ tự mới của toàn bộ danh sách. */
export const useReorderLists = (projectId: number) => {
  const qc = useQueryClient();
  const invalidate = useInvalidateBoard(projectId);
  return useMutation({
    mutationFn: (ids: number[]) => listsApi.reorder(projectId, ids),
    onMutate: async (ids) => ({
      undo: await optimistic(qc, projectId, (b) => ({
        ...b,
        lists: ids.flatMap((id, position) => {
          const l = b.lists.find((x) => x.id === id);
          return l ? [{ ...l, position }] : [];
        }),
      })),
    }),
    onError: (_e, _v, ctx) => ctx?.undo(),
    onSettled: invalidate,
  });
};
