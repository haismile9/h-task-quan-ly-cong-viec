import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import {
  AiFillStar,
  AiOutlineEllipsis,
  AiOutlineFilter,
  AiOutlineStar,
  AiOutlineUserAdd,
} from "react-icons/ai";
import { useProjectTasks, useUpdateTask } from "../../hooks/useTasks";
import { useDeleteProject } from "../../hooks/useProjects";
import { useStarredProjects } from "../../hooks/useStarredProjects";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/Toast";
import { useConfirm } from "../ui/ConfirmDialog";
import Avatar from "../ui/Avatar";
import { getErrorMessage } from "../../api/client";
import AddMemberModal from "../projects/AddMemberModal";
import CreateProjectModal from "../projects/CreateProjectModal";
import type { Project, Task, TaskPriority, TaskStatus } from "../../types";
import TaskColumn, { type ColumnSort } from "./TaskColumn";
import TaskFormModal from "./TaskFormModal";
import TaskDetailModal from "./TaskDetailModal";
import { PRIORITIES, TASK_STATUSES, priorityColor, priorityLabel } from "./taskMeta";
import { closeDropdown } from "../../utils/closeDropdown";

/** Modal đang mở: thêm thẻ chi tiết, sửa thẻ, thêm thành viên, sửa dự án. */
type OpenModal =
  | { type: "create"; status: TaskStatus }
  | { type: "edit"; taskId: number }
  | { type: "member" }
  | { type: "editProject" }
  | null;

interface BoardFilter {
  keyword: string;
  onlyMine: boolean;
  priorities: TaskPriority[];
}

const EMPTY_FILTER: BoardFilter = { keyword: "", onlyMine: false, priorities: [] };
const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

const sortTasks = (tasks: Task[], sort: ColumnSort) => {
  if (sort === "deadline") {
    return [...tasks].sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  }
  if (sort === "priority") {
    return [...tasks].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  }
  return tasks;
};

const headerBtn = "btn btn-ghost btn-sm btn-square text-white hover:bg-white/20 border-none";

/** Bảng Kanban toàn màn hình: thanh tiêu đề bảng + các cột cuộn ngang. */
const TaskBoard = ({ project }: { project: Project }) => {
  const { data: tasks = [], isLoading, error } = useProjectTasks(project.id);
  const updateTask = useUpdateTask(project.id);
  const deleteProject = useDeleteProject();
  const { isStarred, toggleStar } = useStarredProjects();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const [modal, setModal] = useState<OpenModal>(null);
  const [filter, setFilter] = useState<BoardFilter>(EMPTY_FILTER);
  const [sorts, setSorts] = useState<Record<TaskStatus, ColumnSort>>({
    pending: "default",
    in_progress: "default",
    done: "default",
  });

  // Thành viên bảng = người trong project_user + chủ dự án (dữ liệu cũ có thể thiếu chủ).
  const members = useMemo(() => {
    const list = project.users ?? [];
    return project.owner && !list.some((u) => u.id === project.owner_id) ? [project.owner, ...list] : list;
  }, [project.users, project.owner, project.owner_id]);
  // Thẻ đang mở lấy từ dữ liệu mới nhất, nên modal luôn hiển thị thay đổi vừa lưu
  const editingTask = modal?.type === "edit" ? tasks.find((t) => t.id === modal.taskId) : undefined;
  const pending = project.pending_invitations ?? [];
  // Backend chỉ cho admin hoặc chủ dự án sửa/xoá dự án và mời người; mọi thành viên đều gán được việc.
  const isManager = user?.role === "admin" || user?.id === project.owner_id;
  const starred = isStarred(project.id);
  const filterCount = (filter.keyword ? 1 : 0) + (filter.onlyMine ? 1 : 0) + filter.priorities.length;

  const columns = useMemo(() => {
    const keyword = filter.keyword.trim().toLowerCase();
    const visible = tasks.filter(
      (t) =>
        (!keyword || t.title.toLowerCase().includes(keyword) || t.description?.toLowerCase().includes(keyword)) &&
        (!filter.onlyMine || t.assigned_users?.some((u) => u.id === user?.id)) &&
        (filter.priorities.length === 0 || filter.priorities.includes(t.priority))
    );
    const grouped: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], done: [] };
    visible.forEach((t) => grouped[t.status]?.push(t));
    TASK_STATUSES.forEach((s) => (grouped[s] = sortTasks(grouped[s], sorts[s])));
    return grouped;
  }, [tasks, filter, sorts, user?.id]);

  const onDragEnd = ({ source, destination, draggableId }: DropResult) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    updateTask.mutate(
      { id: Number(draggableId), input: { status: destination.droppableId as TaskStatus } },
      { onError: (err) => toast.error(getErrorMessage(err, "Không thể cập nhật trạng thái.")) }
    );
  };

  const togglePriority = (p: TaskPriority) =>
    setFilter((f) => ({
      ...f,
      priorities: f.priorities.includes(p) ? f.priorities.filter((x) => x !== p) : [...f.priorities, p],
    }));

  const handleDeleteProject = async () => {
    const ok = await confirm({
      title: "Xoá dự án",
      message: `Xoá dự án "${project.name}"? Toàn bộ ${tasks.length} nhiệm vụ trong dự án sẽ bị xoá và không thể khôi phục.`,
      confirmText: "Xoá dự án",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteProject.mutateAsync(project.id);
      navigate("/projects", { replace: true, state: { message: `Đã xoá dự án "${project.name}"` } });
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xoá dự án."));
    }
  };

  return (
    <>
      {/* Thanh tiêu đề bảng */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-black/25 text-white backdrop-blur-sm">
        <h1 className="text-lg font-bold truncate px-2">{project.name}</h1>
        {project.description && (
          <p className="hidden xl:block text-sm text-white/75 truncate max-w-sm">{project.description}</p>
        )}
        <div className="flex-1" />

        <button
          className="flex -space-x-2 mr-1 rounded-full"
          aria-label="Xem thành viên dự án"
          onClick={() => setModal({ type: "member" })}
        >
          {members.slice(0, 5).map((m) => (
            <Avatar key={m.id} name={m.name} size="sm" className="ring-2 ring-white/70" />
          ))}
          {/* Người được mời nhưng chưa đăng ký: avatar xám như Trello */}
          {pending.slice(0, Math.max(0, 5 - members.length)).map((inv) => (
            <span
              key={`inv-${inv.id}`}
              title={`${inv.email} – đang chờ đăng ký`}
              className="w-8 h-8 rounded-full bg-base-300 text-base-content/70 text-xs font-semibold inline-flex items-center justify-center ring-2 ring-white/70 opacity-90"
            >
              {inv.email[0].toUpperCase()}
            </span>
          ))}
          {members.length + pending.length > 5 && (
            <span className="w-8 h-8 rounded-full bg-white/30 text-xs font-semibold inline-flex items-center justify-center ring-2 ring-white/70">
              +{members.length + pending.length - 5}
            </span>
          )}
        </button>

        {/* Bộ lọc */}
        <div className="dropdown dropdown-end">
          <button tabIndex={0} className={`${headerBtn} w-auto px-2 gap-1 ${filterCount ? "bg-white/25" : ""}`} title="Lọc thẻ">
            <AiOutlineFilter size={16} />
            {filterCount > 0 && <span className="text-xs">{filterCount}</span>}
          </button>
          <div tabIndex={0} className="dropdown-content z-40 w-72 mt-2 bg-base-100 text-base-content rounded-box shadow-xl border border-base-300 p-4 space-y-4">
            <p className="text-center text-sm font-semibold">Lọc thẻ</p>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold">Từ khoá</span>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Nhập từ khoá…"
                value={filter.keyword}
                onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={filter.onlyMine}
                onChange={(e) => setFilter((f) => ({ ...f, onlyMine: e.target.checked }))}
              />
              Thẻ được giao cho tôi
            </label>
            <div>
              <p className="text-xs font-semibold mb-1">Độ ưu tiên</p>
              <div className="space-y-1">
                {PRIORITIES.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={filter.priorities.includes(p)}
                      onChange={() => togglePriority(p)}
                    />
                    <span className="h-2 w-8 rounded-full" style={{ backgroundColor: priorityColor[p] }} />
                    {priorityLabel[p]}
                  </label>
                ))}
              </div>
            </div>
            {filterCount > 0 && (
              <button className="btn btn-ghost btn-sm w-full" onClick={() => setFilter(EMPTY_FILTER)}>
                Xoá bộ lọc
              </button>
            )}
          </div>
        </div>

        <button
          className={headerBtn}
          onClick={() => toggleStar(project.id)}
          aria-pressed={starred}
          title={starred ? "Bỏ gắn sao" : "Gắn sao dự án"}
        >
          {starred ? <AiFillStar size={16} className="text-warning" /> : <AiOutlineStar size={16} />}
        </button>

        <button
          className="btn btn-sm border-none bg-base-100/90 text-base-content hover:bg-base-100 ml-1"
          onClick={() => setModal({ type: "member" })}
        >
          <AiOutlineUserAdd /> Chia sẻ
        </button>

        <div className="dropdown dropdown-end">
          <button tabIndex={0} className={headerBtn} aria-label="Thêm thao tác">
            <AiOutlineEllipsis size={18} />
          </button>
          <ul tabIndex={0} className="dropdown-content menu z-40 w-60 mt-2 bg-base-100 text-base-content rounded-box shadow-xl border border-base-300 p-2">
            <li className="menu-title">Dự án</li>
            {isManager ? (
              <>
                <li>
                  <button onClick={() => { closeDropdown(); setModal({ type: "editProject" }); }}>Sửa tên, mô tả, phông nền</button>
                </li>
                <li>
                  <button className="text-error" onClick={() => { closeDropdown(); handleDeleteProject(); }}>
                    Xoá dự án
                  </button>
                </li>
              </>
            ) : (
              <li className="disabled">
                <span>Chỉ chủ dự án được sửa hoặc xoá</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Các cột */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden board-scroll">
        {isLoading ? (
          <div className="p-6 text-white flex items-center gap-2">
            <span className="loading loading-spinner" /> Đang tải nhiệm vụ...
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="alert alert-error max-w-md">{getErrorMessage(error, "Không thể tải nhiệm vụ.")}</div>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="h-full flex items-start gap-3 p-3">
              {TASK_STATUSES.map((status) => (
                <TaskColumn
                  key={status}
                  projectId={project.id}
                  status={status}
                  tasks={columns[status]}
                  sort={sorts[status]}
                  onSortChange={(s) => setSorts((prev) => ({ ...prev, [status]: s }))}
                  onTaskClick={(task) => setModal({ type: "edit", taskId: task.id })}
                  onOpenFullForm={(s) => setModal({ type: "create", status: s })}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {modal?.type === "create" && (
        <TaskFormModal
          projectId={project.id}
          members={members}
          canAssign
          initialStatus={modal.status}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" && editingTask && (
        <TaskDetailModal task={editingTask} members={members} onClose={() => setModal(null)} />
      )}
      {modal?.type === "member" && <AddMemberModal project={project} canManage={isManager} onClose={() => setModal(null)} />}
      {modal?.type === "editProject" && <CreateProjectModal project={project} onClose={() => setModal(null)} />}
    </>
  );
};

export default TaskBoard;
