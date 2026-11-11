import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import Avatar from "../ui/Avatar";
import type { ProjectMember } from "../../types";

interface MembersPopoverProps {
  /** Nút đã mở popover; popover đặt ngay dưới (hoặc trên) nút này. */
  anchor: HTMLElement;
  members: ProjectMember[];
  assigneeIds: number[];
  onToggle: (userId: number) => void;
  onClose: () => void;
}

const WIDTH = 288;
const MARGIN = 8;

/**
 * Popover "Thành viên" của thẻ, vẽ qua portal để nổi trên modal (không bị cắt),
 * giữ nguyên khi gán/bỏ gán nhiều người liên tiếp như Trello.
 */
const MembersPopover = ({ anchor, members, assigneeIds, onToggle, onClose }: MembersPopoverProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Tính vị trí theo nút: ưu tiên bên dưới, lật lên trên nếu không đủ chỗ.
  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.getBoundingClientRect();
      const h = ref.current?.offsetHeight ?? 360;
      const left = Math.min(Math.max(MARGIN, a.left), window.innerWidth - WIDTH - MARGIN);
      const below = a.bottom + 4;
      const top = below + h > window.innerHeight - MARGIN ? Math.max(MARGIN, a.top - h - 4) : below;
      setPos({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, members.length, assigneeIds.length]);

  // Bấm ra ngoài (trừ chính nút mở) hoặc Esc thì đóng
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchor.contains(t)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [anchor, onClose]);

  const q = query.trim().toLowerCase();
  const matches = (m: ProjectMember) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  const cardMembers = members.filter((m) => assigneeIds.includes(m.id) && matches(m));
  const boardMembers = members.filter((m) => !assigneeIds.includes(m.id) && matches(m));

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="Thành viên"
      className="fixed z-[1100] bg-base-100 rounded-box shadow-xl border border-base-300 p-3"
      style={{ width: WIDTH, top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
    >
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
    </div>,
    document.body
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
