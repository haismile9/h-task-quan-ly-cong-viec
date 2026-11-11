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
  AiOutlinePlus,
  AiOutlineTag,
  AiOutlineUserAdd,
} from "react-icons/ai";
import { AiFillCheckCircle } from "react-icons/ai";
import Avatar from "../ui/Avatar";
import CommentSection from "../CommentSection";
import MembersPopover from "./MembersPopover";
import MemberProfilePopover from "./MemberProfilePopover";
import { useConfirm } from "../ui/ConfirmDialog";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useDeleteTask, useMoveTask, useUpdateTask } from "../../hooks/useTasks";
import type { TaskInput } from "../../api/tasks";
import type { ProjectMember, Task, TaskList } from "../../types";
import { closeDropdown } from "../../utils/closeDropdown";
import {
  PRIORITIES,
  deadlineChipClass,
  deadlineState,
  isDone as taskIsDone,
  priorityColor,
  priorityLabel,
} from "./taskMeta";

interface TaskDetailModalProps {
  task: Task;
  lists: TaskList[];
  members: ProjectMember[];
  onClose: () => void;
}

const popover = "dropdown-content z-50 w-72 mt-1 bg-base-100 rounded-box shadow-xl border border-base-300 p-3";
const chipBtn = "btn btn-sm bg-base-100 border-base-300 font-normal hover:bg-base-200";

/** Chi tiết thẻ: trái là nội dung, phải là bình luận. Mọi thay đổi được lưu ngay. */
const TaskDetailModal = ({ task, lists, members, onClose }: TaskDetailModalProps) => {
  const updateTask = useUpdateTask(task.project_id);
  const deleteTask = useDeleteTask(task.project_id);
  const moveTask = useMoveTask(task.project_id);
  const currentList = lists.find((l) => l.id === task.list_id);
  const toast = useToast();
  const confirm = useConfirm();

  const [title, setTitle] = useState(task.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(task.description ?? "");
  const [deadline, setDeadline] = useState(task.deadline?.slice(0, 10) ?? "");
  const [showDetails, setShowDetails] = useState(true);
  /** Nút đang mở popover Thành viên (nút "Thành viên" hoặc nút ＋ cạnh avatar). */
  const [membersAnchor, setMembersAnchor] = useState<HTMLElement | null>(null);
  const toggleMembers = (el: HTMLElement) => setMembersAnchor((cur) => (cur === el ? null : el));
  /** Avatar đang mở thẻ hồ sơ (Xem hồ sơ / Gỡ bỏ khỏi thẻ). */
  const [profile, setProfile] = useState<{ anchor: HTMLElement; member: ProjectMember } | null>(null);

  // Đồng bộ khi dữ liệu thẻ thay đổi từ nơi khác (kéo thả, cập nhật...)
  useEffect(() => setTitle(task.title), [task.title]);
  useEffect(() => {
    if (!editingDesc) setDescription(task.description ?? "");
  }, [task.description, editingDesc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Popover tự xử lý Esc của nó; modal chỉ đóng khi không có popover mở
      if (e.key !== "Escape" || editingDesc || membersAnchor || profile) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editingDesc, membersAnchor, profile]);

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

  // Giữ danh sách người được gán ở state riêng: bấm gán/gỡ liên tiếp không bị dùng dữ liệu cũ
  const serverAssigneeKey = (task.assigned_users ?? []).map((u) => u.id).join(",");
  const [assigneeIds, setAssigneeIds] = useState<number[]>(() => task.assigned_users?.map((u) => u.id) ?? []);
  useEffect(() => {
    if (!updateTask.isPending) setAssigneeIds(serverAssigneeKey ? serverAssigneeKey.split(",").map(Number) : []);
  }, [serverAssigneeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleAssignee = (id: number) => {
    const next = assigneeIds.includes(id) ? assigneeIds.filter((x) => x !== id) : [...assigneeIds, id];
    setAssigneeIds(next);
    save({ assigned_user_ids: next });
  };

  const isDone = taskIsDone(task);
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
              {currentList?.name ?? "Danh sách"} <AiOutlineDown size={12} />
            </button>
            <ul tabIndex={0} className="dropdown-content menu z-50 w-56 mt-1 bg-base-100 rounded-box shadow-xl border border-base-300 p-2">
              <li className="menu-title">Chuyển tới danh sách</li>
              {lists.map((l) => (
                <li key={l.id}>
                  <button
                    className={l.id === task.list_id ? "menu-active" : ""}
                    onClick={() => {
                      closeDropdown();
                      if (l.id === task.list_id) return;
                      // Vị trí rất lớn = cuối danh sách (backend và cache đều tự kẹp về độ dài thật)
                      moveTask.mutate(
                        { id: task.id, listId: l.id, index: Number.MAX_SAFE_INTEGER },
                        { onError: (err) => toast.error(getErrorMessage(err, "Không chuyển được thẻ.")) }
                      );
                    }}
                  >
                    {l.name}
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
                onClick={() => save({ status: isDone ? "pending" : "done" }, isDone ? undefined : "Đã đánh dấu hoàn thành")}
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

              <button
                className={`${chipBtn} ${membersAnchor ? "!bg-neutral !text-neutral-content" : ""}`}
                onClick={(e) => toggleMembers(e.currentTarget)}
                aria-expanded={!!membersAnchor}
              >
                <AiOutlineUserAdd /> Thành viên
              </button>
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
              <Field label="Thành viên">
                <div className="flex items-center gap-1">
                  {members
                    .filter((m) => assigneeIds.includes(m.id))
                    .map((u) => (
                      <button
                        key={u.id}
                        className="rounded-full hover:ring-2 hover:ring-primary"
                        onClick={(e) => {
                          const el = e.currentTarget;
                          setProfile((cur) => (cur?.member.id === u.id ? null : { anchor: el, member: u }));
                        }}
                        aria-label={`Hồ sơ ${u.name}`}
                      >
                        <Avatar name={u.name} size="md" className="!w-8 !h-8" />
                      </button>
                    ))}
                  <button
                    className="w-8 h-8 rounded-full bg-base-200 hover:bg-base-300 flex items-center justify-center"
                    onClick={(e) => toggleMembers(e.currentTarget)}
                    aria-label="Thêm thành viên vào thẻ"
                    title="Thêm thành viên"
                  >
                    <AiOutlinePlus />
                  </button>
                </div>
              </Field>
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
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold flex items-center gap-2 flex-1">
                <AiOutlineComment className="text-xl" /> Bình luận và hoạt động
              </h3>
              <button className="btn btn-sm bg-base-100 border-base-300 font-normal" onClick={() => setShowDetails((v) => !v)}>
                {showDetails ? "Ẩn chi tiết" : "Hiện chi tiết"}
              </button>
            </div>
            <CommentSection taskId={task.id} showActivity={showDetails} />
            <p className="text-xs text-base-content/50 mt-4">
              Thẻ được tạo lúc {dayjs(task.created_at).format("HH:mm DD/MM/YYYY")}
            </p>
          </aside>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose} />
      {profile && (
        <MemberProfilePopover
          anchor={profile.anchor}
          member={profile.member}
          onRemove={() => toggleAssignee(profile.member.id)}
          onClose={() => setProfile(null)}
        />
      )}
      {membersAnchor && (
        <MembersPopover
          anchor={membersAnchor}
          members={members}
          assigneeIds={assigneeIds}
          onToggle={toggleAssignee}
          onClose={() => setMembersAnchor(null)}
        />
      )}
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
