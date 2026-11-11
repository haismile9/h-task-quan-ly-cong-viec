import { useNavigate } from "react-router-dom";
import { AiOutlineClose } from "react-icons/ai";
import Avatar from "../ui/Avatar";
import AnchoredPopover from "../ui/AnchoredPopover";
import { useAuth } from "../../context/AuthContext";
import type { ProjectMember } from "../../types";

interface MemberProfilePopoverProps {
  anchor: HTMLElement;
  member: ProjectMember;
  onRemove: () => void;
  onClose: () => void;
}

const roleLabel: Record<string, string> = { admin: "Quản trị viên", leader: "Trưởng nhóm", member: "Thành viên" };

/** Bấm vào avatar trên thẻ: thẻ hồ sơ nhỏ, "Xem hồ sơ" và "Gỡ bỏ khỏi thẻ" (giống Trello). */
const MemberProfilePopover = ({ anchor, member, onRemove, onClose }: MemberProfilePopoverProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMe = user?.id === member.id;

  return (
    <AnchoredPopover anchor={anchor} onClose={onClose} width={320} label={`Hồ sơ ${member.name}`} className="p-0">
      <div className="relative bg-primary text-primary-content h-20 pl-28 pr-10 flex flex-col justify-center">
        <Avatar
          name={member.name}
          size="md"
          className="!absolute left-4 top-3 !w-20 !h-20 !text-2xl ring-4 ring-base-100"
        />
        <p className="font-bold text-lg leading-tight truncate">{member.name}</p>
        <p className="text-sm opacity-90 truncate">{member.email}</p>
        <button
          className="btn btn-ghost btn-xs btn-square absolute top-2 right-2 text-primary-content hover:bg-white/20"
          onClick={onClose}
          aria-label="Đóng"
        >
          <AiOutlineClose />
        </button>
      </div>
      <div className="pt-6 pb-2">
        {member.role && <p className="px-4 pb-2 text-xs text-base-content/60">{roleLabel[member.role] ?? member.role}</p>}
        <ul className="menu w-full p-0">
          <li>
            {isMe ? (
              <button
                onClick={() => {
                  onClose();
                  navigate("/account");
                }}
              >
                Xem hồ sơ
              </button>
            ) : (
              <a href={`mailto:${member.email}`}>Gửi email</a>
            )}
          </li>
          <li className="border-t border-base-300 mt-1 pt-1">
            <button
              onClick={() => {
                onRemove();
                onClose();
              }}
            >
              Gỡ bỏ khỏi thẻ
            </button>
          </li>
        </ul>
      </div>
    </AnchoredPopover>
  );
};

export default MemberProfilePopover;
