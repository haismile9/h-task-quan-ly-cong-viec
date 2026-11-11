import { useEffect, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import {
  AiOutlineAlignLeft,
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineClose,
  AiOutlineComment,
  AiOutlineDown,
  AiOutlineEllipsis,
  AiOutlineTag,
  AiOutlineUserAdd,
} from "react-icons/ai";
import { AiFillCheckCircle } from "react-icons/ai";
import Avatar from "../ui/Avatar";
import CommentSection from "../CommentSection";
import { useConfirm } from "../ui/ConfirmDialog";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useDeleteTask, useUpdateTask } from "../../hooks/useTasks";
import type { TaskInput } from "../../api/tasks";
import type { ProjectMember, Task, TaskStatus } from "../../types";
import { closeDropdown } from "../../utils/closeDropdown";
import {
  PRIORITIES,
  TASK_STATUSES,
  deadlineChipClass,
  deadlineState,
  priorityColor,
  priorityLabel,
  statusLabel,
} from "./taskMeta";

interface TaskDetailModalProps {
  task: Task;
  members: ProjectMember[];
  /** Backend chỉ cho admin hoặc chủ dự án gán người thực hiện. */
  canAssign: boolean;
  onClose: () => void;
}

const popover = "dropdown-content z-50 w-72 mt-1 bg-base-100 rounded-box shadow-xl border border-base-300 p-3";
const chipBtn = "btn btn-sm bg-base-100 border-base-300 font-normal hover:bg-base-200";

/** Chi tiết thẻ: trái là nội dung, phải là bình luận. Mọi thay đổi được lưu ngay. */
const TaskDetailModal = ({ task, members, canAssign, onClose }: TaskDetailModalProps) => {
  const updateTask = useUpdateTask(task.project_id);
  const deleteTask = useDeleteTask(task.project_id);
  const toast = useToast();
  const confirm = useConfirm();

  const [title, setTitle] = useState(task.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(task.description ?? "");
  const [deadline, setDeadline] = useState(task.deadline?.slice(0, 10) ?? "");

  // Đồng bộ khi dữ liệu thẻ thay đổi từ nơi khác (kéo thả, cập nhật...)
  useEffect(() => setTitle(task.title), [task.title]);
  useEffect(() => {
    if (!editingDesc) setDescription(task.description ?? "");
  }, [task.description, editingDesc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !editingDesc && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editingDesc]);

  const save = (input: TaskInput, success?: string) =>
    updateTask.mutate(
      { id: task.id, input },
      {
        onSuccess: () => success && toast.success(success),
        onError: (err) => toast.error(getErrorMessage(err, "Không lưu được thay đổi.")),
      }
    );

  const saveTitle = () => {
    const text = title.trim();
    if (!text) return setTitle(task.title);
    if (text !== task.title) save({ title: text });
  };

  const assigneeIds = task.assigned_users?.map((u) => u.id) ?? [];
  const toggleAssignee = (id: number) =>
    save({ assigned_user_ids: assigneeIds.includes(id) ? assigneeIds.filter((x) => x !== id) : [...assigneeIds, id] });

  const isDone = task.status === "done";
  const deadlineInfo = deadlineState(task);

  const handleDelete = async () => {
    closeDropdown();
    const ok = await confirm({
      title: "Xoá thẻ",
      message: `Xoá thẻ "${task.title}"? Bình luận của thẻ cũng sẽ bị xoá.`,
      confirmText: "Xoá thẻ",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Đã xoá thẻ");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không xoá được thẻ."));
    }
  };

  return (
    <div className="modal modal-open items-start pt-10 sm:pt-16" role="dialog" aria-modal="true" aria-label={task.title}>
      <div className="modal-box p-0 w-11/12 max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Thanh trên: chọn cột, thao tác, đóng */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-base-300">
          <div className="dropdown">
            <button tabIndex={0} className="btn btn-sm bg-base-200 border-none font-medium">
              {statusLabel[task.status]} <AiOutlineDown size={12} />
            </button>
            <ul tabIndex={0} className="dropdown-content menu z-50 w-48 mt-1 bg-base-100 rounded-box shadow-xl border border-base-300 p-2">
              <li className="menu-title">Chuyển tới cột</li>
              {TASK_STATUSES.map((s) => (
                <li key={s}>
                  <button
                    className={s === task.status ? "menu-active" : ""}
                    onClick={() => {
                      closeDropdown();
                      if (s !== task.status) save({ status: s as TaskStatus });
                    }}
                  >
                    {statusLabel[s]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1" />
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm btn-square" aria-label="Thao tác thẻ">
              <AiOutlineEllipsis size={18} />
            </button>
            <ul tabIndex={0} className="dropdown-content menu z-50 w-44 mt-1 bg-base-100 rounded-box shadow-xl border border-base-300 p-2">
              <li>
                <button className="text-error" onClick={handleDelete}>
                  Xoá thẻ
                </button>
              </li>
            </ul>
          </div>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose} aria-label="Đóng">
            <AiOutlineClose size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 grid md:grid-cols-[1fr_380px] overflow-y-auto md:overflow-hidden">
          {/* Cột trái: nội dung thẻ */}
          <div className="p-6 space-y-6 md:overflow-y-auto">
            <div className="flex items-start gap-3">
              <button
                className={`mt-1.5 text-2xl shrink-0 transition ${isDone ? "text-success" : "text-base-content/40 hover:text-success"}`}
                onClick={() => save({ status: isDone ? "in_progress" : "done" }, isDone ? undefined : "Đã đánh dấu hoàn thành")}
                title={isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
                aria-pressed={isDone}
              >
                {isDone ? <AiFillCheckCircle /> : <AiOutlineCheckCircle />}
              </button>
              <textarea
                rows={1}
                className="flex-1 text-2xl font-bold bg-transparent resize-none rounded px-1 -mx-1 focus:outline-none focus:ring-2 focus:ring-primary field-sizing-content"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLTextAreaElement).blur();
                  }
                }}
                aria-label="Tiêu đề thẻ"
              />
            </div>

            {/* Hàng nút: Nhãn, Ngày, Thành viên */}
            <div className="flex flex-wrap gap-2 pl-10">
              <div className="dropdown">
                <button tabIndex={0} className={chipBtn}>
                  <AiOutlineTag /> Nhãn
                </button>
                <div tabIndex={0} className={popover}>
                  <p className="text-center text-sm font-semibold mb-2">Độ ưu tiên</p>
                  <div className="space-y-1">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        className="w-full h-8 rounded flex items-center px-3 text-sm font-medium text-[#172b4d] hover:opacity-90"
                        style={{ backgroundColor: priorityColor[p] }}
                        onClick={() => {
                          closeDropdown();
                          save({ priority: p });
                        }}
                      >
                        {priorityLabel[p]}
                        {task.priority === p && <span className="ml-auto">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dropdown">
                <button tabIndex={0} className={chipBtn}>
                  <AiOutlineClockCircle /> Ngày
                </button>
                <div tabIndex={0} className={popover}>
                  <p className="text-center text-sm font-semibold mb-2">Ngày hết hạn</p>
                  <input
                    type="date"
                    className="input input-bordered input-sm w-full"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      className="btn btn-primary btn-sm flex-1"
                      onClick={() => {
                        closeDropdown();
                        save({ deadline: deadline || null });
                      }}
                    >
                      Lưu
                    </button>
                    {task.deadline && (
                      <button
                        className="btn btn-ghost btn-sm flex-1"
                        onClick={() => {
                          closeDropdown();
                          setDeadline("");
                          save({ deadline: null });
                        }}
                      >
                        Gỡ bỏ
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="dropdown">
                <button tabIndex={0} className={chipBtn} disabled={!canAssign} title={canAssign ? undefined : "Chỉ chủ dự án được giao việc"}>
                  <AiOutlineUserAdd /> Thành viên
                </button>
                <div tabIndex={0} className={popover}>
                  <p className="text-center text-sm font-semibold mb-2">Thành viên dự án</p>
                  {members.length === 0 ? (
                    <p className="text-sm text-base-content/60 text-center">Dự án chưa có thành viên.</p>
                  ) : (
                    <ul className="space-y-1 max-h-60 overflow-y-auto">
                      {members.map((m) => (
                        <li key={m.id}>
                          <button
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-base-200 text-sm text-left"
                            onClick={() => toggleAssignee(m.id)}
                          >
                            <Avatar name={m.name} size="xs" />
                            <span className="flex-1 truncate">{m.name}</span>
                            {assigneeIds.includes(m.id) && <span className="text-primary">✓</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Giá trị hiện tại */}
            <div className="flex flex-wrap gap-6 pl-10">
              <Field label="Độ ưu tiên">
                <span
                  className="inline-flex items-center h-8 px-3 rounded text-sm font-medium text-[#172b4d]"
                  style={{ backgroundColor: priorityColor[task.priority] }}
                >
                  {priorityLabel[task.priority]}
                </span>
              </Field>
              {task.deadline && (
                <Field label="Ngày hết hạn">
                  <span className={`inline-flex items-center gap-2 h-8 px-3 rounded text-sm bg-base-200 ${deadlineInfo && deadlineInfo !== "normal" ? deadlineChipClass[deadlineInfo] : ""}`}>
                    {dayjs(task.deadline).format("DD/MM/YYYY")}
                    {deadlineInfo === "overdue" && <span className="text-xs">Quá hạn</span>}
                    {deadlineInfo === "soon" && <span className="text-xs">Sắp hết hạn</span>}
                    {deadlineInfo === "done" && <span className="text-xs">Hoàn tất</span>}
                  </span>
                </Field>
              )}
              {(task.assigned_users?.length ?? 0) > 0 && (
                <Field label="Thành viên">
                  <div className="flex -space-x-1.5">
                    {task.assigned_users!.map((u) => (
                      <Avatar key={u.id} name={u.name} size="sm" className="ring-2 ring-base-100" />
                    ))}
                  </div>
                </Field>
              )}
            </div>

            {/* Mô tả */}
            <section>
              <div className="flex items-center gap-3 mb-2">
                <AiOutlineAlignLeft className="text-xl shrink-0" />
                <h3 className="font-semibold flex-1">Mô tả</h3>
                {!editingDesc && task.description && (
                  <button className="btn btn-sm bg-base-200 border-none" onClick={() => setEditingDesc(true)}>
                    Chỉnh sửa
                  </button>
                )}
              </div>
              <div className="pl-8">
                {editingDesc ? (
                  <>
                    <textarea
                      className="textarea textarea-bordered w-full min-h-32"
                      placeholder="Thêm mô tả chi tiết hơn…"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          save({ description: description.trim() || null });
                          setEditingDesc(false);
                        }}
                      >
                        Lưu
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setDescription(task.description ?? "");
                          setEditingDesc(false);
                        }}
                      >
                        Huỷ
                      </button>
                    </div>
                  </>
                ) : task.description ? (
                  <p className="text-sm whitespace-pre-line">{task.description}</p>
                ) : (
                  <button
                    className="w-full text-left text-sm text-base-content/60 rounded-lg border border-base-300 px-3 py-3 min-h-16 hover:bg-base-200"
                    onClick={() => setEditingDesc(true)}
                  >
                    Thêm mô tả chi tiết hơn…
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Cột phải: bình luận và hoạt động */}
          <aside className="bg-base-200 p-4 md:overflow-y-auto border-t md:border-t-0 md:border-l border-base-300">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <AiOutlineComment className="text-xl" /> Bình luận và hoạt động
            </h3>
            <CommentSection taskId={task.id} />
            <p className="text-xs text-base-content/50 mt-4">
              Thẻ được tạo lúc {dayjs(task.created_at).format("HH:mm DD/MM/YYYY")}
            </p>
          </aside>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose} />
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="text-xs font-semibold text-base-content/60 mb-1">{label}</p>
    {children}
  </div>
);

export default TaskDetailModal;
