import { useState, type ReactNode } from "react";
import {
  AiFillStar,
  AiOutlineAlignLeft,
  AiOutlineClose,
  AiOutlineDelete,
  AiOutlineInfoCircle,
  AiOutlineLeft,
  AiOutlineStar,
  AiOutlineUser,
  AiOutlineUserAdd,
} from "react-icons/ai";
import AnchoredPopover from "../ui/AnchoredPopover";
import Avatar from "../ui/Avatar";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useUpdateProject } from "../../hooks/useProjects";
import { DEFAULT_BACKGROUND, backgroundCss } from "../../utils/boardBackgrounds";
import { BackgroundPopover } from "../projects/BackgroundPicker";
import type { Project } from "../../types";

type View = "menu" | "about" | "background";

interface BoardMenuProps {
  project: Project;
  anchor: HTMLElement;
  /** Chủ dự án hoặc admin: được sửa mô tả, đổi nền, xoá dự án. */
  canManage: boolean;
  starred: boolean;
  onToggleStar: () => void;
  onShare: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const WIDTH = 340;

/** Hàng thao tác trong Menu (biểu tượng + tiêu đề + dòng phụ). */
const MenuItem = ({
  icon,
  label,
  hint,
  onClick,
  danger,
  right,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  danger?: boolean;
  right?: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left hover:bg-base-200 ${danger ? "text-error" : ""}`}
  >
    <span className="w-6 flex justify-center text-lg shrink-0">{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm">{label}</span>
      {hint && <span className="block text-xs text-base-content/60 truncate">{hint}</span>}
    </span>
    {right}
  </button>
);

/**
 * Menu của bảng kiểu Trello: một popup duy nhất chuyển qua lại giữa
 * Menu → Về bảng này (quản trị viên, mô tả) / Thay đổi hình nền, có nút quay lại.
 */
const BoardMenu = ({ project, anchor, canManage, starred, onToggleStar, onShare, onDelete, onClose }: BoardMenuProps) => {
  const [view, setView] = useState<View>("menu");
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(project.description || "");
  const [background, setBackground] = useState(project.background_url || DEFAULT_BACKGROUND);
  const update = useUpdateProject();
  const toast = useToast();
  const owner = project.owner;

  const header = (title: string, onBack?: () => void) => (
    <div className="flex items-center mb-3">
      {onBack ? (
        <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={onBack} aria-label="Quay lại">
          <AiOutlineLeft />
        </button>
      ) : (
        <span className="w-6" />
      )}
      <p className="flex-1 text-center text-sm font-semibold">{title}</p>
      <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={onClose} aria-label="Đóng">
        <AiOutlineClose />
      </button>
    </div>
  );

  const saveDescription = async () => {
    const text = description.trim();
    if (text === (project.description || "")) return setEditingDesc(false);
    try {
      await update.mutateAsync({ id: project.id, input: { description: text } });
      setEditingDesc(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Không lưu được mô tả."));
    }
  };

  const pickBackground = (value: string) => {
    const previous = background;
    setBackground(value);
    update.mutate(
      { id: project.id, input: { background_url: value } },
      {
        onError: (err) => {
          setBackground(previous);
          toast.error(getErrorMessage(err, "Không đổi được hình nền."));
        },
      }
    );
  };

  if (view === "background") {
    return (
      <BackgroundPopover
        anchor={anchor}
        value={background}
        onChange={pickBackground}
        onClose={onClose}
        onBack={() => setView("menu")}
      />
    );
  }

  if (view === "about") {
    return (
      <AnchoredPopover anchor={anchor} onClose={onClose} width={WIDTH} label="Về bảng này">
        {header("Về bảng này", () => {
          setEditingDesc(false);
          setView("menu");
        })}

        <p className="flex items-center gap-2 font-semibold mb-2">
          <AiOutlineUser /> Quản trị viên của bảng
        </p>
        {owner ? (
          <div className="flex items-center gap-3 mb-5 pl-1">
            <Avatar name={owner.name} size="md" />
            <div className="min-w-0">
              <p className="font-semibold truncate">{owner.name}</p>
              <p className="text-xs text-base-content/60 truncate">{owner.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-base-content/60 mb-5 pl-1">Không rõ</p>
        )}

        <p className="flex items-center gap-2 font-semibold mb-2">
          <AiOutlineAlignLeft /> Mô tả
        </p>
        {editingDesc ? (
          <div className="space-y-2">
            <textarea
              className="textarea textarea-bordered w-full min-h-28 text-sm"
              placeholder="Bảng này được dùng để làm gì?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={saveDescription} disabled={update.isPending}>
                {update.isPending && <span className="loading loading-spinner loading-xs" />}
                Lưu
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setDescription(project.description || "");
                  setEditingDesc(false);
                }}
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : canManage ? (
          <button
            type="button"
            onClick={() => setEditingDesc(true)}
            className="w-full min-h-24 text-left text-sm rounded-md bg-base-200 hover:bg-base-300 p-3 whitespace-pre-wrap break-words"
          >
            {project.description || (
              <span className="text-base-content/70">
                Thêm mô tả để cho đồng đội của bạn biết bảng này được sử dụng để làm gì.
              </span>
            )}
          </button>
        ) : (
          <p className="text-sm rounded-md bg-base-200 p-3 whitespace-pre-wrap break-words">
            {project.description || <span className="text-base-content/60">Chưa có mô tả.</span>}
          </p>
        )}
      </AnchoredPopover>
    );
  }

  return (
    <AnchoredPopover anchor={anchor} onClose={onClose} width={WIDTH} label="Menu">
      {header("Menu")}
      <MenuItem
        icon={<AiOutlineUserAdd />}
        label="Chia sẻ"
        onClick={() => {
          onClose();
          onShare();
        }}
        right={owner && <Avatar name={owner.name} size="sm" />}
      />
      <div className="border-t border-base-300 my-2" />
      <MenuItem
        icon={<AiOutlineInfoCircle />}
        label="Về bảng này"
        hint={project.description || (canManage ? "Thêm mô tả vào bảng của bạn" : undefined)}
        onClick={() => setView("about")}
      />
      <MenuItem
        icon={starred ? <AiFillStar className="text-warning" /> : <AiOutlineStar />}
        label={starred ? "Bỏ gắn sao" : "Gắn sao"}
        onClick={onToggleStar}
      />
      {canManage && (
        <>
          <div className="border-t border-base-300 my-2" />
          <MenuItem
            icon={<span className="block w-6 h-5 rounded" style={{ background: backgroundCss(background, { thumb: true }) }} />}
            label="Thay đổi hình nền"
            onClick={() => setView("background")}
          />
          <MenuItem
            icon={<AiOutlineDelete />}
            label="Xoá dự án"
            danger
            onClick={() => {
              onClose();
              onDelete();
            }}
          />
        </>
      )}
    </AnchoredPopover>
  );
};

export default BoardMenu;
