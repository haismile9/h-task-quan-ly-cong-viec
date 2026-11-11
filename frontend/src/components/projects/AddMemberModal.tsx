import { useState, type FormEvent } from "react";
import { AiOutlineCopy, AiOutlineMail } from "react-icons/ai";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import { useToast } from "../ui/Toast";
import { useConfirm } from "../ui/ConfirmDialog";
import { getErrorMessage } from "../../api/client";
import { useAddProjectMember, useCancelInvitation } from "../../hooks/useProjects";
import type { Project } from "../../types";

interface ShareProjectModalProps {
  project: Project;
  /** Chủ dự án hoặc admin: được mời và huỷ lời mời. */
  canManage: boolean;
  onClose: () => void;
}

/**
 * Hộp thoại "Chia sẻ dự án": mời theo email, xem thành viên và lời mời đang chờ.
 * Email chưa có tài khoản → lời mời qua mail; người đó vào dự án khi đăng ký bằng email ấy.
 */
const AddMemberModal = ({ project, canManage, onClose }: ShareProjectModalProps) => {
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const addMember = useAddProjectMember(project.id);
  const cancelInvitation = useCancelInvitation(project.id);
  const toast = useToast();
  const confirm = useConfirm();

  const members = project.users ?? [];
  const pending = project.pending_invitations ?? [];

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setInviteLink(null);
    try {
      const result = await addMember.mutateAsync(email.trim());
      if (result.status === "invited" && !result.mail_sent) {
        // Không gửi được mail (vd. SMTP lỗi): đưa link để chủ dự án tự gửi.
        setInviteLink(result.invite_url);
        toast.warning(result.message);
      } else {
        toast.success(result.message);
      }
      setEmail("");
    } catch {
      // Lỗi hiển thị bên dưới ô nhập
    }
  };

  const handleCancel = async (id: number, inviteeEmail: string) => {
    const ok = await confirm({
      title: "Huỷ lời mời",
      message: `Huỷ lời mời gửi tới ${inviteeEmail}? Link trong email sẽ không còn dùng được.`,
      confirmText: "Huỷ lời mời",
      danger: true,
    });
    if (!ok) return;
    try {
      await cancelInvitation.mutateAsync(id);
      toast.success("Đã huỷ lời mời");
    } catch (err) {
      toast.error(getErrorMessage(err, "Không huỷ được lời mời."));
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Đã sao chép link mời");
    } catch {
      toast.error("Không sao chép được, hãy chọn và sao chép thủ công.");
    }
  };

  return (
    <Modal title="Chia sẻ dự án" onClose={onClose}>
      {canManage ? (
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            className="input input-bordered input-sm flex-1"
            placeholder="Địa chỉ email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!email.trim() || addMember.isPending}>
            {addMember.isPending && <span className="loading loading-spinner loading-xs" />}
            Chia sẻ
          </button>
        </form>
      ) : (
        <p className="text-sm text-base-content/60">Chỉ chủ dự án mới được mời thêm thành viên.</p>
      )}

      {addMember.isError && (
        <p className="text-error text-xs">{getErrorMessage(addMember.error, "Không thể mời thành viên.")}</p>
      )}
      {canManage && (
        <p className="text-xs text-base-content/60">
          Người chưa có tài khoản sẽ nhận email mời và tự vào dự án khi đăng ký bằng chính email đó.
        </p>
      )}

      {inviteLink && (
        <div className="alert alert-warning text-xs flex-col items-start gap-2">
          <span>Chưa gửi được email. Bạn có thể tự gửi link mời này:</span>
          <div className="flex w-full gap-2">
            <input readOnly value={inviteLink} className="input input-xs input-bordered flex-1 bg-base-100" onFocus={(e) => e.target.select()} />
            <button type="button" className="btn btn-xs" onClick={copyLink}>
              <AiOutlineCopy /> Sao chép
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-base-300 pt-3">
        <p className="text-xs font-semibold text-base-content/60 mb-2">
          Thành viên ({members.length + pending.length})
        </p>
        <ul className="space-y-1 max-h-72 overflow-y-auto">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-1">
              <Avatar name={m.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-base-content/60 truncate">{m.email}</p>
              </div>
              <span className="badge badge-sm badge-ghost">
                {m.id === project.owner_id || m.pivot?.role === "leader" ? "Chủ dự án" : "Thành viên"}
              </span>
            </li>
          ))}
          {pending.map((inv) => (
            <li key={`inv-${inv.id}`} className="flex items-center gap-3 py-1">
              <span className="w-8 h-8 rounded-full border-2 border-dashed border-base-300 text-base-content/50 flex items-center justify-center">
                <AiOutlineMail />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{inv.email}</p>
                <p className="text-xs text-base-content/60">Đang chờ đăng ký tài khoản</p>
              </div>
              {canManage ? (
                <button
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => handleCancel(inv.id, inv.email)}
                  disabled={cancelInvitation.isPending}
                >
                  Huỷ
                </button>
              ) : (
                <span className="badge badge-sm badge-outline">Đang chờ</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default AddMemberModal;
