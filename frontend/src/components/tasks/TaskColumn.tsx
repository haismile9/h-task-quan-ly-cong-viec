import { useEffect, useRef, useState, type FormEvent } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { AiOutlineClose, AiOutlineEllipsis, AiOutlineForm, AiOutlinePlus } from "react-icons/ai";
import { useCreateTask } from "../../hooks/useTasks";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import type { Task, TaskStatus } from "../../types";
import TaskCard from "./TaskCard";
import { closeDropdown } from "../../utils/closeDropdown";
import { statusLabel } from "./taskMeta";

export type ColumnSort = "default" | "deadline" | "priority";

const SORT_LABEL: Record<ColumnSort, string> = {
  default: "Mặc định",
  deadline: "Hạn chót gần nhất",
  priority: "Độ ưu tiên cao nhất",
};

interface TaskColumnProps {
  projectId: number;
  status: TaskStatus;
  tasks: Task[];
  sort: ColumnSort;
  onSortChange: (sort: ColumnSort) => void;
  onTaskClick: (task: Task) => void;
  /** Mở form đầy đủ (mô tả, hạn, người được gán...). */
  onOpenFullForm: (status: TaskStatus) => void;
}

/** Một cột trên bảng: tiêu đề + menu, danh sách thẻ, ô thêm thẻ nhanh ở cuối. */
const TaskColumn = ({
  projectId,
  status,
  tasks,
  sort,
  onSortChange,
  onTaskClick,
  onOpenFullForm,
}: TaskColumnProps) => {
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const createTask = useCreateTask(projectId);
  const toast = useToast();

  useEffect(() => {
    if (composing) inputRef.current?.focus();
  }, [composing]);

  const closeComposer = () => {
    setComposing(false);
    setTitle("");
  };

  const handleAdd = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = title.trim();
    if (!text) return;
    try {
      await createTask.mutateAsync({ title: text, status });
      setTitle("");
      inputRef.current?.focus();
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể thêm thẻ."));
    }
  };

  return (
    <section className="w-[272px] shrink-0 max-h-full flex flex-col bg-base-200 rounded-xl shadow-sm">
      <header className="flex items-center gap-1 pl-3 pr-1 pt-2 pb-1">
        <h3 className="font-semibold text-sm flex-1 truncate">{statusLabel[status]}</h3>
        <span className="text-xs text-base-content/60 px-1">{tasks.length}</span>
        <div className="dropdown dropdown-end">
          <button tabIndex={0} className="btn btn-ghost btn-xs btn-square" aria-label={`Thao tác cột ${statusLabel[status]}`}>
            <AiOutlineEllipsis size={16} />
          </button>
          <div tabIndex={0} className="dropdown-content z-30 w-64 bg-base-100 rounded-box shadow-xl border border-base-300 p-2 mt-1">
            <p className="text-center text-sm font-semibold pb-2 mb-1 border-b border-base-300">Thao tác</p>
            <ul className="menu menu-sm p-0 w-full">
              <li>
                <button onClick={() => { closeDropdown(); setComposing(true); }}>Thêm thẻ</button>
              </li>
              <li>
                <button onClick={() => { closeDropdown(); onOpenFullForm(status); }}>Thêm thẻ chi tiết…</button>
              </li>
              <li className="menu-title pt-2">Sắp xếp theo</li>
              {(Object.keys(SORT_LABEL) as ColumnSort[]).map((s) => (
                <li key={s}>
                  <button className={sort === s ? "menu-active" : ""} onClick={() => { closeDropdown(); onSortChange(s); }}>
                    {SORT_LABEL[s]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={(el) => {
              provided.innerRef(el);
              listRef.current = el;
            }}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto column-scroll px-2 pt-1 min-h-[4px] rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "bg-base-300/60" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                {(drag, dragSnapshot) => (
                  <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className="pb-2">
                    <TaskCard task={task} onClick={() => onTaskClick(task)} isDragging={dragSnapshot.isDragging} />
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
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!title.trim() || createTask.isPending}>
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
            onClick={() => onOpenFullForm(status)}
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
