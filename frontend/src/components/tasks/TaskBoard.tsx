import { useMemo, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { AiOutlinePlus, AiOutlineUserAdd } from "react-icons/ai";
import { useProjectTasks, useUpdateTask } from "../../hooks/useTasks";
import { useToast } from "../ui/Toast";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../api/client";
import AddMemberModal from "../projects/AddMemberModal";
import type { Project, Task, TaskStatus } from "../../types";
import TaskColumn from "./TaskColumn";
import TaskFormModal from "./TaskFormModal";
import { TASK_STATUSES } from "./taskMeta";

/** Modal đang mở: thêm task, sửa một task, hoặc thêm thành viên. */
type OpenModal = { type: "create" } | { type: "edit"; task: Task } | { type: "member" } | null;

const TaskBoard = ({ project }: { project: Project }) => {
  const { data: tasks = [], isLoading, error } = useProjectTasks(project.id);
  const updateTask = useUpdateTask(project.id);
  const toast = useToast();
  const [modal, setModal] = useState<OpenModal>(null);
  const { user } = useAuth();
  const members = project.users ?? [];
  const canAssign = user?.role === "admin" || user?.id === project.owner_id;

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

  if (isLoading) return <div className="p-4 text-center"><span className="loading loading-spinner" /></div>;
  if (error) return <div className="alert alert-error">{getErrorMessage(error, "Không thể tải nhiệm vụ.")}</div>;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Bảng công việc</h2>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-outline" onClick={() => setModal({ type: "member" })}>
            <AiOutlineUserAdd /> Thành viên
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setModal({ type: "create" })}>
            <AiOutlinePlus /> Thêm nhiệm vụ
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {TASK_STATUSES.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onTaskClick={(task) => setModal({ type: "edit", task })}
            />
          ))}
        </div>
      </DragDropContext>

      <div className="mt-6">
        <h3 className="font-semibold text-sm mb-2">👥 Thành viên ({members.length})</h3>
        {members.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <span key={m.id} className="badge badge-outline" title={m.email}>
                {m.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-base-content/50">Chưa có thành viên nào.</p>
        )}
      </div>

      {(modal?.type === "create" || modal?.type === "edit") && (
        <TaskFormModal
          projectId={project.id}
          members={members}
          canAssign={canAssign}
          task={modal.type === "edit" ? modal.task : undefined}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "member" && <AddMemberModal projectId={project.id} onClose={() => setModal(null)} />}
    </div>
  );
};

export default TaskBoard;
