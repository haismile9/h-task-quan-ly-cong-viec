import { useState, type FormEvent } from "react";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useCreateTask } from "../../hooks/useTasks";
import type { ProjectMember, TaskPriority, TaskStatus } from "../../types";
import { PRIORITIES, TASK_STATUSES, priorityLabel, statusLabel } from "./taskMeta";

interface TaskFormModalProps {
  projectId: number;
  members: ProjectMember[];
  /** Cột được chọn khi bấm "Thêm thẻ chi tiết". */
  initialStatus?: TaskStatus;
  /** Backend chỉ cho admin hoặc chủ dự án gán người thực hiện. */
  canAssign: boolean;
  onClose: () => void;
}

/** Tạo thẻ với đầy đủ thông tin (thẻ nhanh dùng ô nhập trong cột; xem/sửa dùng TaskDetailModal). */
const TaskFormModal = ({ projectId, members, initialStatus, canAssign, onClose }: TaskFormModalProps) => {
  const toast = useToast();
  const createTask = useCreateTask(projectId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus ?? "pending");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description || null,
        deadline: deadline || null,
        status,
        priority,
        ...(canAssign ? { assigned_user_ids: assigneeIds } : {}),
      });
      toast.success("Đã thêm thẻ");
      onClose();
    } catch {
      // Lỗi hiển thị bên dưới form
    }
  };

  return (
    <Modal title="Thêm thẻ" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-3">
        <input
          className="input input-bordered w-full"
          placeholder="Tiêu đề thẻ"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Mô tả (không bắt buộc)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Cột
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
          <label className="flex flex-col gap-1 text-sm">
            Ngày hết hạn
            <input type="date" className="input input-bordered w-full" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
        </div>

        {canAssign && members.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-1">Giao cho</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={assigneeIds.includes(m.id)}
                    onChange={(e) =>
                      setAssigneeIds((prev) => (e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id)))
                    }
                  />
                  <Avatar name={m.name} size="xs" />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {createTask.isError && <p className="text-error text-sm">{getErrorMessage(createTask.error, "Không thể thêm thẻ.")}</p>}

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="btn btn-primary" disabled={!title.trim() || createTask.isPending}>
            {createTask.isPending && <span className="loading loading-spinner loading-sm" />}
            Thêm thẻ
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
