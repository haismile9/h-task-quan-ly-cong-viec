import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { AiOutlineCheck, AiOutlineClose, AiOutlineEllipsis, AiOutlineLeft, AiOutlineSearch, AiOutlineUpload } from "react-icons/ai";
import AnchoredPopover from "../ui/AnchoredPopover";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../api/client";
import { useMyBackgrounds, useUploadBackground } from "../../hooks/useBackgrounds";
import { BOARD_GRADIENTS, backgroundCss } from "../../utils/boardBackgrounds";
import { PHOTO_CATEGORIES, PRESET_PHOTOS, searchPresetPhotos, type PresetPhoto } from "../../utils/presetPhotos";

interface BackgroundPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_SIZE = 5 * 1024 * 1024;
const COLORS = BOARD_GRADIENTS.map((g) => ({ value: `gradient:${g.id}`, label: g.label }));

/** Ô màu / ảnh, có dấu ✓ khi đang chọn. */
const Swatch = ({
  css,
  selected,
  label,
  onClick,
  className = "h-8",
}: {
  css: string;
  selected: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={selected}
    onClick={onClick}
    className={`${className} rounded-md flex items-center justify-center text-white hover:brightness-90 transition ${
      selected ? "ring-2 ring-offset-1 ring-primary" : ""
    }`}
    style={{ background: css }}
  >
    {selected && <AiOutlineCheck className="drop-shadow" />}
  </button>
);

/** Ô ảnh có sẵn: hiện tên ảnh khi rê chuột. */
const PhotoTile = ({ photo, selected, onPick, className }: { photo: PresetPhoto; selected: boolean; onPick: () => void; className: string }) => (
  <button
    type="button"
    onClick={onPick}
    title={photo.label}
    aria-label={photo.label}
    aria-pressed={selected}
    className={`relative group rounded-md overflow-hidden bg-base-300 bg-cover bg-center hover:brightness-90 transition flex items-center justify-center text-white ${className} ${
      selected ? "ring-2 ring-offset-1 ring-primary" : ""
    }`}
    style={{ backgroundImage: `url("${photo.thumb}")` }}
  >
    {selected && <AiOutlineCheck className="text-lg drop-shadow" />}
    <span className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 text-[10px] text-left bg-black/50 truncate opacity-0 group-hover:opacity-100 transition">
      {photo.label}
    </span>
  </button>
);

/**
 * Chọn phông nền như Trello: hàng chọn nhanh + nút ⋯ mở "Phông nền bảng"
 * (Ảnh, Màu sắc, tải ảnh của bạn). "Xem thêm" mở toàn bộ ảnh có sẵn kèm tìm kiếm.
 */
const BackgroundPicker = ({ value, onChange }: BackgroundPickerProps) => {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [view, setView] = useState<"main" | "photos">("main");
  const [allColors, setAllColors] = useState(false);
  const [search, setSearch] = useState("");
  const photos = useMemo(() => searchPresetPhotos(search), [search]);

  const { data: uploads = [] } = useMyBackgrounds();
  const upload = useUploadBackground();

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE) return toast.error("Ảnh tối đa 5MB");
    try {
      onChange(await upload.mutateAsync(file));
      toast.success("Đã tải ảnh lên");
    } catch (err) {
      toast.error(getErrorMessage(err, "Không tải được ảnh."));
    }
  };

  // Hàng chọn nhanh: 3 ảnh + 2 màu, luôn kèm lựa chọn hiện tại
  const quick: Array<{ value: string; css: string; label: string }> = [
    ...PRESET_PHOTOS.slice(0, 3).map((p) => ({ value: p.url, css: `#ddd url("${p.thumb}") center / cover`, label: p.label })),
    ...COLORS.map((c) => ({ value: c.value, css: backgroundCss(c.value), label: c.label })),
  ].slice(0, 5);
  if (!quick.some((q) => q.value === value)) {
    quick[quick.length - 1] = { value, css: backgroundCss(value, { thumb: true }), label: "Đang chọn" };
  }

  const close = () => {
    setAnchor(null);
    setView("main");
    setSearch("");
  };

  const header = (title: React.ReactNode, onBack?: () => void) => (
    <div className="flex items-center mb-3">
      {onBack ? (
        <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={onBack} aria-label="Quay lại">
          <AiOutlineLeft />
        </button>
      ) : (
        <span className="w-6" />
      )}
      <p className="flex-1 text-center text-sm font-semibold">{title}</p>
      <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={close} aria-label="Đóng">
        <AiOutlineClose />
      </button>
    </div>
  );

  return (
    <div>
      <p className="text-xs font-semibold mb-1.5">Phông nền</p>
      <div className="grid grid-cols-6 gap-1.5">
        {quick.map((q) => (
          <Swatch
            key={q.value}
            css={q.css}
            label={q.label}
            selected={q.value === value}
            onClick={() => onChange(q.value)}
          />
        ))}
        <button
          type="button"
          className="h-8 rounded-md bg-base-200 hover:bg-base-300 flex items-center justify-center"
          onClick={(e) => {
            const el = e.currentTarget;
            setAnchor((cur) => (cur ? null : el));
            setView("main");
          }}
          aria-label="Xem thêm phông nền"
          aria-expanded={!!anchor}
        >
          <AiOutlineEllipsis />
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

      {anchor && view === "main" && (
        <AnchoredPopover anchor={anchor} onClose={close} width={320} label="Phông nền bảng">
          {header("Phông nền bảng")}

          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Ảnh</p>
            <button type="button" className="btn btn-xs" onClick={() => setView("photos")}>
              Xem thêm
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {PRESET_PHOTOS.slice(0, 6).map((p) => (
              <PhotoTile key={p.id} photo={p} selected={p.url === value} onPick={() => onChange(p.url)} className="h-14" />
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Màu sắc</p>
            <button type="button" className="btn btn-xs" onClick={() => setAllColors((v) => !v)}>
              {allColors ? "Thu gọn" : "Xem thêm"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(allColors ? COLORS : COLORS.slice(0, 6)).map((c) => (
              <Swatch
                key={c.value}
                css={backgroundCss(c.value)}
                label={c.label}
                selected={c.value === value}
                onClick={() => onChange(c.value)}
                className="h-10"
              />
            ))}
          </div>

          <div className="border-t border-base-300 mt-4 pt-3">
            <button
              type="button"
              className="btn btn-ghost btn-sm w-full justify-start font-normal"
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
            >
              {upload.isPending ? <span className="loading loading-spinner loading-xs" /> : <AiOutlineUpload />}
              Tải ảnh của bạn lên
            </button>
            {uploads.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {uploads.slice(0, 8).map((url) => (
                  <Swatch
                    key={url}
                    css={backgroundCss(url)}
                    label="Ảnh bạn đã tải lên"
                    selected={url === value}
                    onClick={() => onChange(url)}
                    className="h-10"
                  />
                ))}
              </div>
            )}
          </div>
        </AnchoredPopover>
      )}

      {anchor && view === "photos" && (
        <AnchoredPopover anchor={anchor} onClose={close} width={340} label="Ảnh">
          {header("Ảnh", () => setView("main"))}
          <label className="input input-bordered input-sm w-full flex items-center gap-2 mb-2">
            <AiOutlineSearch className="text-base-content/50" />
            <input
              className="grow"
              placeholder="Tìm ảnh (vd. núi, biển, rừng)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button type="button" className="text-base-content/50 hover:text-base-content" onClick={() => setSearch("")} aria-label="Xoá từ khoá">
                <AiOutlineClose />
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-1 mb-3">
            {PHOTO_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`btn btn-xs font-normal ${search === c ? "btn-primary" : "btn-ghost bg-base-200"}`}
                onClick={() => setSearch(search === c ? "" : c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="max-h-[360px] overflow-y-auto pr-1">
            {photos.length === 0 ? (
              <p className="text-sm text-base-content/60 text-center py-6">Không tìm thấy ảnh phù hợp.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {photos.map((p) => (
                  <PhotoTile key={p.id} photo={p} selected={p.url === value} onPick={() => onChange(p.url)} className="h-20" />
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-base-content/50 mt-2 text-center">
            Ảnh từ{" "}
            <a href="https://unsplash.com/?utm_source=h_task&utm_medium=referral" target="_blank" rel="noreferrer" className="link">
              Unsplash
            </a>
          </p>
        </AnchoredPopover>
      )}
    </div>
  );
};

export default BackgroundPicker;
