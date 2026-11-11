import { useState, type FormEvent } from "react";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { useCreateList } from "../../hooks/useTasks";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";

/** Ô "＋ Thêm danh sách khác" ở cuối bảng; nhập tên rồi Enter để tạo, có thể tạo liên tiếp. */
const AddListComposer = ({ projectId }: { projectId: number }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createList = useCreateList(projectId);
  const toast = useToast();

  const close = () => {
    setOpen(false);
    setName("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = name.trim();
    if (!text) return;
    try {
      await createList.mutateAsync(text);
      setName("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thêm được danh sách."));
    }
  };

  if (!open) {
    return (
      <button
        className="w-[272px] shrink-0 h-11 flex items-center gap-2 px-3 rounded-xl bg-white/25 hover:bg-white/35 text-white font-medium text-sm transition"
        onClick={() => setOpen(true)}
      >
        <AiOutlinePlus /> Thêm danh sách khác
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-[272px] shrink-0 bg-base-200 rounded-xl p-2 shadow-sm">
      <input
        className="input input-sm input-bordered w-full"
        placeholder="Nhập tên danh sách…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && close()}
        autoFocus
        aria-label="Tên danh sách mới"
      />
      <div className="flex items-center gap-1 mt-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={!name.trim() || createList.isPending}>
          Thêm danh sách
        </button>
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={close} aria-label="Huỷ">
          <AiOutlineClose />
        </button>
      </div>
    </form>
  );
};

export default AddListComposer;
