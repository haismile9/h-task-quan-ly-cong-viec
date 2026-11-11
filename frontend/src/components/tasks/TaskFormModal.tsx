import { useState } from "react";
import Modal from "../ui/Modal";
import CommentSection from "../CommentSection";
import { useConfirm } from "../ui/ConfirmDialog";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useCreateTask, useDeleteTask, useUpdateTask } from "../../hooks/useTasks";
import type { ProjectMember, Task, TaskPriority, TaskStatus } from "../../types";
import { TASK_STATUSES, priorityLabel, statusLabel } from "./taskMeta";

interface TaskFormModalProps {
  projectId: number;
  members: ProjectMember[];
  /** Có task → chế độ sửa; không có → tạo mới. */
  task?: Task;
  /** Backend chỉ cho admin hoặc chủ dự án gán người thực hiện. */
  canAssign: boolean;
  onClose: () => void;
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

const TaskFormModal = ({ projectId, members, task, canAssign, onClose }: TaskFormModalProps) => {
  const isEdit = !!task;
  const toast = useToast();
  const confirm = useConfirm();
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [deadline, setDeadline] = useState(task?.deadline?.slice(0, 10) ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "pending");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [assigneeIds, setAssigneeIds] = useState<number[]>(task?.assigned_users?.map((u) => u.id) ?? []);
  const [error, setError] = useState("");

  const saving = createTask.isPending || updateTask.isPending;

  const toggleAssignee = (id: number, checked: boolean) =>
    setAssigneeIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  const handleSave = async () => {
    setError("");
    const input = {
      title: title.trim(),
      description: description || null,
      deadline: deadline || null,
      status,
      priority,
      ...(canAssign ? { assigned_user_ids: assigneeIds } : {}),
    };
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, input });
        toast.success("Đã lưu nhiệm vụ");
      } else {
        await createTask.mutateAsync(input);
        toast.success("Đã thêm nhiệm vụ");
      }
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể lưu nhiệm vụ."));
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const ok = await confirm({
      title: "Xoá nhiệm vụ",
      message: `Bạn có chắc muốn xoá "${task.title}"?`,
      confirmText: "Xoá",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Đã xoá nhiệm vụ");
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể xoá nhiệm vụ."));
    }
  };

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa nhiệm vụ" : "Thêm nhiệm vụ mới"}
      onClose={onClose}
      size={isEdit ? "lg" : "md"}
      actions={
        <>
          {isEdit && (
            <button className="btn btn-error btn-outline mr-auto" onClick={handleDelete} disabled={deleteTask.isPending}>
              Xoá
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim() || saving}>
            {saving && <span className="loading loading-spinner loading-sm" />}
            {isEdit ? "Lưu" : "Thêm"}
          </button>
        </>
      }
    >
      <input
        className="input input-bordered w-full"
        placeholder="Tên nhiệm vụ"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <textarea
        className="textarea textarea-bordered w-full"
        placeholder="Mô tả"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Hạn chót
          <input type="date" className="input input-bordered w-full" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Trạng thái
          <select className="select select-bordered w-full" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Độ ưu tiên
          <select className="select select-bordered w-full" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {priorityLabel[p]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">
          Gán thành viên
          {!canAssign && <span className="font-normal text-base-content/50"> (chỉ chủ dự án được gán)</span>}
        </p>
        {members.length === 0 ? (
          <p className="text-sm italic text-base-content/50">Dự án chưa có thành viên.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1">
            {members.map((m) => (
              <label key={m.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={assigneeIds.includes(m.id)}
                  disabled={!canAssign}
                  onChange={(e) => toggleAssignee(m.id, e.target.checked)}
                />
                {m.name} <span className="text-base-content/50">({m.email})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {task && (
        <div className="border-t border-base-300 pt-3">
          <CommentSection taskId={task.id} />
        </div>
      )}
    </Modal>
  );
};

export default TaskFormModal;
