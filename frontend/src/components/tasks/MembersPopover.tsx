import { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import Avatar from "../ui/Avatar";
import AnchoredPopover from "../ui/AnchoredPopover";
import type { ProjectMember } from "../../types";

interface MembersPopoverProps {
  anchor: HTMLElement;
  members: ProjectMember[];
  assigneeIds: number[];
  onToggle: (userId: number) => void;
  onClose: () => void;
}

/** Popover "Thành viên" của thẻ: tìm kiếm, gán/bỏ gán liên tiếp mà không đóng (giống Trello). */
const MembersPopover = ({ anchor, members, assigneeIds, onToggle, onClose }: MembersPopoverProps) => {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (m: ProjectMember) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  const cardMembers = members.filter((m) => assigneeIds.includes(m.id) && matches(m));
  const boardMembers = members.filter((m) => !assigneeIds.includes(m.id) && matches(m));

  return (
    <AnchoredPopover anchor={anchor} onClose={onClose} label="Thành viên">
      <div className="flex items-center mb-3">
        <span className="w-6" />
        <p className="flex-1 text-center text-sm font-semibold">Thành viên</p>
        <button className="btn btn-ghost btn-xs btn-square" onClick={onClose} aria-label="Đóng">
          <AiOutlineClose />
        </button>
      </div>
      <input
        className="input input-bordered input-sm w-full mb-3"
        placeholder="Tìm kiếm các thành viên"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <div className="max-h-72 overflow-y-auto space-y-3">
        <Group title="Thành viên của thẻ" people={cardMembers} selected onToggle={onToggle} />
        <Group title="Thành viên của bảng" people={boardMembers} onToggle={onToggle} />
        {cardMembers.length === 0 && boardMembers.length === 0 && (
          <p className="text-sm text-base-content/60 text-center py-2">Không tìm thấy thành viên.</p>
        )}
      </div>
    </AnchoredPopover>
  );
};

const Group = ({
  title,
  people,
  selected,
  onToggle,
}: {
  title: string;
  people: ProjectMember[];
  selected?: boolean;
  onToggle: (id: number) => void;
}) =>
  people.length === 0 ? null : (
    <div>
      <p className="text-xs font-semibold text-base-content/60 mb-1">{title}</p>
      <ul>
        {people.map((m) => (
          <li key={m.id}>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-base-200 text-sm text-left"
              onClick={() => onToggle(m.id)}
              title={selected ? "Bấm để bỏ khỏi thẻ" : "Bấm để thêm vào thẻ"}
            >
              <Avatar name={m.name} size="sm" />
              <span className="flex-1 truncate">{m.name}</span>
              {selected && <AiOutlineClose className="text-base-content/50" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

export default MembersPopover;
