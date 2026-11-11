import { useMemo, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { AiOutlineEdit, AiOutlineUserAdd } from "react-icons/ai";
import { useProjectTasks, useUpdateTask } from "../../hooks/useTasks";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/Toast";
import Avatar from "../ui/Avatar";
import { getErrorMessage } from "../../api/client";
import AddMemberModal from "../projects/AddMemberModal";
import CreateProjectModal from "../projects/CreateProjectModal";
import type { Project, Task, TaskStatus } from "../../types";
import TaskColumn from "./TaskColumn";
import TaskFormModal from "./TaskFormModal";
import { TASK_STATUSES } from "./taskMeta";

/** Modal đang mở: thêm thẻ vào một cột, sửa thẻ, thêm thành viên, sửa dự án. */
type OpenModal =
  | { type: "create"; status: TaskStatus }
  | { type: "edit"; task: Task }
  | { type: "member" }
  | { type: "editProject" }
  | null;

/** Bảng Kanban toàn màn hình: thanh tiêu đề bảng + các cột cuộn ngang trên nền xanh. */
const TaskBoard = ({ project }: { project: Project }) => {
  const { data: tasks = [], isLoading, error } = useProjectTasks(project.id);
  const updateTask = useUpdateTask(project.id);
  const { user } = useAuth();
  const toast = useToast();
  const [modal, setModal] = useState<OpenModal>(null);

  const members = project.users ?? [];
  // Backend chỉ cho admin hoặc chủ dự án gán người, sửa và xoá dự án.
  const isManager = user?.role === "admin" || user?.id === project.owner_id;
  const canAssign = isManager;

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], done: [] };
    tasks.forEach((t) => grouped[t.status]?.push(t));
    return grouped;
  }, [tasks]);

  const onDragEnd = ({ source, destination, draggableId }: DropResult) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    updateTask.mutate(
      { id: Number(draggableId), input: { status: destination.droppableId as TaskStatus } },
      { onError: (err) => toast.error(getErrorMessage(err, "Không thể cập nhật trạng thái.")) }
    );
  };

  return (
    <>
      {/* Thanh tiêu đề bảng */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-black/25 text-white backdrop-blur-sm">
        <h1 className="text-lg font-bold truncate px-1">{project.name}</h1>
        {isManager && (
          <button
            className="btn btn-ghost btn-xs btn-square text-white hover:bg-white/20"
            onClick={() => setModal({ type: "editProject" })}
            aria-label="Sửa dự án"
            title="Sửa dự án"
          >
            <AiOutlineEdit />
          </button>
        )}
        {project.description && (
          <p className="hidden lg:block text-sm text-white/80 truncate max-w-md">{project.description}</p>
        )}
        <div className="flex-1" />
        <div className="flex -space-x-2" aria-label="Thành viên dự án">
          {members.slice(0, 6).map((m) => (
            <Avatar key={m.id} name={m.name} size="sm" className="ring-2 ring-white/70" />
          ))}
          {members.length > 6 && (
            <span className="w-8 h-8 rounded-full bg-white/30 text-xs font-semibold inline-flex items-center justify-center ring-2 ring-white/70">
              +{members.length - 6}
            </span>
          )}
        </div>
        <button
          className="btn btn-sm border-none bg-base-100/90 text-base-content hover:bg-base-100"
          onClick={() => setModal({ type: "member" })}
        >
          <AiOutlineUserAdd /> Chia sẻ
        </button>
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
                  status={status}
                  tasks={columns[status]}
                  onTaskClick={(task) => setModal({ type: "edit", task })}
                  onAddTask={(s) => setModal({ type: "create", status: s })}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {(modal?.type === "create" || modal?.type === "edit") && (
        <TaskFormModal
          projectId={project.id}
          members={members}
          canAssign={canAssign}
          task={modal.type === "edit" ? modal.task : undefined}
          initialStatus={modal.type === "create" ? modal.status : undefined}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "member" && <AddMemberModal projectId={project.id} onClose={() => setModal(null)} />}
      {modal?.type === "editProject" && <CreateProjectModal project={project} onClose={() => setModal(null)} />}
    </>
  );
};

export default TaskBoard;
