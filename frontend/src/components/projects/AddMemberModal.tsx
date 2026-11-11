import { useState } from "react";
import Modal from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useAddProjectMember } from "../../hooks/useProjects";

interface AddMemberModalProps {
  projectId: number;
  onClose: () => void;
}

const AddMemberModal = ({ projectId, onClose }: AddMemberModalProps) => {
  const [email, setEmail] = useState("");
  const addMember = useAddProjectMember(projectId);
  const toast = useToast();

  const handleAdd = async () => {
    try {
      await addMember.mutateAsync(email.trim());
      toast.success("Đã thêm thành viên");
      onClose();
    } catch {
      // Lỗi hiển thị bên dưới ô nhập
    }
  };

  return (
    <Modal
      title="Thêm thành viên"
      size="sm"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!email.trim() || addMember.isPending}>
            Thêm
          </button>
        </>
      }
    >
      <input
        type="email"
        className="input input-bordered w-full"
        placeholder="Email thành viên"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && email.trim() && handleAdd()}
        autoFocus
      />
      {addMember.isError && (
        <p className="text-error text-sm">{getErrorMessage(addMember.error, "Không thể thêm thành viên.")}</p>
      )}
    </Modal>
  );
};

export default AddMemberModal;
