import { useRef, useState, type ChangeEvent } from "react";
import { AiOutlineCheck, AiOutlineClose, AiOutlineEllipsis, AiOutlinePlus } from "react-icons/ai";
import AnchoredPopover from "../ui/AnchoredPopover";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useMyBackgrounds, useUploadBackground } from "../../hooks/useBackgrounds";
import { BOARD_GRADIENTS, backgroundCss } from "../../utils/boardBackgrounds";

interface BackgroundPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_SIZE = 5 * 1024 * 1024;

/** Một ô chọn nền (ảnh hoặc màu), có dấu ✓ khi đang chọn. */
const Swatch = ({ value, selected, label, onClick, className = "h-8" }: { value: string; selected: boolean; label: string; onClick: () => void; className?: string }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={selected}
    onClick={onClick}
    className={`${className} rounded-md flex items-center justify-center text-white hover:opacity-90 ${selected ? "ring-2 ring-offset-1 ring-primary" : ""}`}
    style={{ background: backgroundCss(value) }}
  >
    {selected && <AiOutlineCheck className="drop-shadow" />}
  </button>
);

/**
 * Chọn phông nền như Trello: hàng chọn nhanh (ảnh gần đây + vài màu) và nút ⋯ mở
 * "Phông nền bảng" đầy đủ với mục Ảnh (tải ảnh lên) và Màu sắc.
 */
const BackgroundPicker = ({ value, onChange }: BackgroundPickerProps) => {
  const { data: photos = [] } = useMyBackgrounds();
  const upload = useUploadBackground();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [allColors, setAllColors] = useState(false);

  const colors = BOARD_GRADIENTS.map((g) => ({ value: `gradient:${g.id}`, label: g.label }));
  // Hàng chọn nhanh: tối đa 2 ảnh gần đây + các màu đầu, luôn kèm lựa chọn hiện tại
  const quick = [...photos.slice(0, 2).map((url) => ({ value: url, label: "Ảnh đã tải lên" })), ...colors].slice(0, 5);
  if (!quick.some((q) => q.value === value)) quick[quick.length - 1] = { value, label: "Đang chọn" };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE) return toast.error("Ảnh tối đa 5MB");
    try {
      const url = await upload.mutateAsync(file);
      onChange(url);
      toast.success("Đã tải ảnh lên");
    } catch (err) {
      toast.error(getErrorMessage(err, "Không tải được ảnh."));
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold mb-1.5">Phông nền</p>
      <div className="grid grid-cols-6 gap-1.5">
        {quick.map((q) => (
          <Swatch key={q.value} value={q.value} label={q.label} selected={q.value === value} onClick={() => onChange(q.value)} />
        ))}
        <button
          type="button"
          className="h-8 rounded-md bg-base-200 hover:bg-base-300 flex items-center justify-center"
          onClick={(e) => {
            const el = e.currentTarget;
            setAnchor((cur) => (cur ? null : el));
          }}
          aria-label="Xem thêm phông nền"
          aria-expanded={!!anchor}
        >
          <AiOutlineEllipsis />
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

      {anchor && (
        <AnchoredPopover anchor={anchor} onClose={() => setAnchor(null)} width={304} label="Phông nền bảng">
          <div className="flex items-center mb-3">
            <span className="w-6" />
            <p className="flex-1 text-center text-sm font-semibold">Phông nền bảng</p>
            <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={() => setAnchor(null)} aria-label="Đóng">
              <AiOutlineClose />
            </button>
          </div>

          <p className="text-sm font-semibold mb-2">Ảnh</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              className="h-14 rounded-md border-2 border-dashed border-base-300 hover:border-primary hover:text-primary flex flex-col items-center justify-center text-xs text-base-content/70"
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
            >
              {upload.isPending ? <span className="loading loading-spinner loading-sm" /> : <AiOutlinePlus />}
              Tải ảnh lên
            </button>
            {photos.map((url) => (
              <Swatch key={url} value={url} label="Ảnh đã tải lên" selected={url === value} onClick={() => onChange(url)} className="h-14" />
            ))}
          </div>
          {photos.length === 0 && (
            <p className="text-xs text-base-content/60 -mt-2 mb-4">JPG, PNG hoặc WebP, tối đa 5MB. Ảnh bạn tải lên sẽ hiện ở đây để dùng lại.</p>
          )}

          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Màu sắc</p>
            <button type="button" className="btn btn-xs" onClick={() => setAllColors((v) => !v)}>
              {allColors ? "Thu gọn" : "Xem thêm"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(allColors ? colors : colors.slice(0, 6)).map((c) => (
              <Swatch key={c.value} value={c.value} label={c.label} selected={c.value === value} onClick={() => onChange(c.value)} className="h-10" />
            ))}
          </div>
        </AnchoredPopover>
      )}
    </div>
  );
};

export default BackgroundPicker;
