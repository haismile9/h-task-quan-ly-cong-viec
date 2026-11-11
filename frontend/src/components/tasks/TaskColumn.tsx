import { useEffect, useRef, useState, type FormEvent } from "react";
import { Draggable, Droppable, type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { AiOutlineClose, AiOutlineEllipsis, AiOutlineForm, AiOutlinePlus } from "react-icons/ai";
import { useCreateTask, useDeleteList, useRenameList, useUpdateTask } from "../../hooks/useTasks";
import { useToast } from "../ui/Toast";
import { useConfirm } from "../ui/ConfirmDialog";
import { getErrorMessage } from "../../api/client";
import AnchoredPopover from "../ui/AnchoredPopover";
import type { Task, TaskList } from "../../types";
import TaskCard from "./TaskCard";

interface TaskColumnProps {
  projectId: number;
  list: TaskList;
  /** Thẻ của danh sách, đã sắp theo position (và đã lọc nếu đang lọc). */
  tasks: Task[];
  /** Tổng số thẻ thật của danh sách (khi đang lọc có thể khác tasks.length). */
  totalCount: number;
  /** Tay nắm để kéo cả cột (gắn vào phần tiêu đề). */
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  canDelete: boolean;
  onTaskClick: (task: Task) => void;
  /** Mở form đầy đủ (mô tả, hạn, người được gán...). */
  onOpenFullForm: (listId: number) => void;
}

/** Một danh sách trên bảng: tiêu đề (bấm để đổi tên, kéo để di chuyển), thẻ, ô thêm thẻ nhanh. */
const TaskColumn = ({
  projectId,
  list,
  tasks,
  totalCount,
  dragHandleProps,
  canDelete,
  onTaskClick,
  onOpenFullForm,
}: TaskColumnProps) => {
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  /** Đóng menu rồi chạy thao tác. */
  const runAction = (action: () => void) => {
    setMenuAnchor(null);
    action();
  };
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const createTask = useCreateTask(projectId);
  const renameList = useRenameList(projectId);
  const deleteList = useDeleteList(projectId);
  const updateTask = useUpdateTask(projectId);
  const toast = useToast();

  const toggleDone = (task: Task) =>
    updateTask.mutate(
      { id: task.id, input: { status: task.status === "done" ? "pending" : "done" } },
      { onError: (err) => toast.error(getErrorMessage(err, "Không cập nhật được trạng thái thẻ.")) }
    );
  const confirm = useConfirm();

  useEffect(() => {
    if (composing) inputRef.current?.focus();
  }, [composing]);
  useEffect(() => setName(list.name), [list.name]);

  const closeComposer = () => {
    setComposing(false);
    setTitle("");
  };

  const handleAdd = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = title.trim();
    if (!text) return;
    // Xoá ô nhập ngay (thẻ đã hiện lạc quan) để gõ tiếp thẻ sau; lỗi thì trả lại chữ đã gõ
    setTitle("");
    inputRef.current?.focus();
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    try {
      await createTask.mutateAsync({ title: text, list_id: list.id });
    } catch (err) {
      setTitle((cur) => cur || text);
      toast.error(getErrorMessage(err, "Không thể thêm thẻ."));
    }
  };

  const saveName = () => {
    setRenaming(false);
    const text = name.trim();
    if (!text || text === list.name) return setName(list.name);
    renameList.mutate(
      { id: list.id, name: text },
      { onError: (err) => toast.error(getErrorMessage(err, "Không đổi được tên danh sách.")) }
    );
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Xoá danh sách",
      message:
        totalCount > 0
          ? `Xoá danh sách "${list.name}" cùng ${totalCount} thẻ bên trong? Không thể khôi phục.`
          : `Xoá danh sách "${list.name}"?`,
      confirmText: "Xoá danh sách",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteList.mutateAsync(list.id);
      toast.success("Đã xoá danh sách");
    } catch (err) {
      toast.error(getErrorMessage(err, "Không xoá được danh sách."));
    }
  };

  return (
    <section className="w-[272px] shrink-0 max-h-full flex flex-col bg-base-200 rounded-xl shadow-sm">
      <header className="flex items-center gap-1 pl-2 pr-1 pt-2 pb-1" {...dragHandleProps}>
        {renaming ? (
          <input
            className="input input-sm input-bordered flex-1 font-semibold"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setName(list.name);
                setRenaming(false);
              }
            }}
            autoFocus
            aria-label="Tên danh sách"
          />
        ) : (
          <h3
            className="font-semibold text-sm flex-1 truncate px-1 py-1 rounded cursor-pointer hover:bg-base-300"
            onClick={() => setRenaming(true)}
            title="Bấm để đổi tên, kéo để di chuyển"
          >
            {list.name}
          </h3>
        )}
        <span className="text-xs text-base-content/60 px-1">{totalCount}</span>
        {/* Menu tự quản lý trạng thái: nằm trong tay nắm kéo nên không dùng được dropdown theo focus */}
        <button
          className="btn btn-ghost btn-xs btn-square"
          aria-label={`Thao tác danh sách ${list.name}`}
          aria-expanded={!!menuAnchor}
          onClick={(e) => {
            const el = e.currentTarget;
            setMenuAnchor((cur) => (cur ? null : el));
          }}
        >
          <AiOutlineEllipsis size={16} />
        </button>
        {menuAnchor && (
          <AnchoredPopover anchor={menuAnchor} onClose={() => setMenuAnchor(null)} width={256} label="Thao tác danh sách" className="p-2">
            <p className="text-center text-sm font-semibold pb-2 mb-1 border-b border-base-300">Thao tác</p>
            <ul className="menu menu-sm p-0 w-full">
              <li>
                <button onClick={() => runAction(() => setComposing(true))}>Thêm thẻ</button>
              </li>
              <li>
                <button onClick={() => runAction(() => onOpenFullForm(list.id))}>Thêm thẻ chi tiết…</button>
              </li>
              <li>
                <button onClick={() => runAction(() => setRenaming(true))}>Đổi tên danh sách</button>
              </li>
              {canDelete && (
                <li>
                  <button className="text-error" onClick={() => runAction(handleDelete)}>
                    Xoá danh sách
                  </button>
                </li>
              )}
            </ul>
          </AnchoredPopover>
        )}
      </header>

      <Droppable droppableId={`list-${list.id}`} type="CARD">
        {(provided, snapshot) => (
          <div
            ref={(el) => {
              provided.innerRef(el);
              listRef.current = el;
            }}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto column-scroll px-2 pt-1 min-h-[8px] rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "bg-base-300/60" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={`task-${task.id}`} index={index} isDragDisabled={task.id < 0}>
                {(drag, dragSnapshot) => (
                  <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className="pb-2">
                    <TaskCard
                      task={task}
                      onClick={() => task.id > 0 && onTaskClick(task)}
                      isDragging={dragSnapshot.isDragging}
                      onToggleDone={task.id > 0 ? () => toggleDone(task) : undefined}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {composing && (
              <form onSubmit={handleAdd} className="pb-2">
                <textarea
                  ref={inputRef}
                  rows={2}
                  className="textarea w-full text-sm bg-base-100 shadow-[0_1px_1px_#091e4240] resize-none"
                  placeholder="Nhập tiêu đề thẻ…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) handleAdd(e);
                    if (e.key === "Escape") closeComposer();
                  }}
                />
                <div className="flex items-center gap-1 mt-1">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!title.trim()}>
                    Thêm thẻ
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={closeComposer} aria-label="Huỷ">
                    <AiOutlineClose />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Droppable>

      {!composing && (
        <footer className="flex items-center gap-1 p-2 pt-1">
          <button
            className="btn btn-ghost btn-sm flex-1 justify-start font-normal text-base-content/70 hover:bg-base-300"
            onClick={() => setComposing(true)}
          >
            <AiOutlinePlus /> Thêm thẻ
          </button>
          <button
            className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:bg-base-300"
            onClick={() => onOpenFullForm(list.id)}
            aria-label="Thêm thẻ với đầy đủ thông tin"
            title="Thêm thẻ với đầy đủ thông tin"
          >
            <AiOutlineForm />
          </button>
        </footer>
      )}
    </section>
  );
};

export default TaskColumn;
