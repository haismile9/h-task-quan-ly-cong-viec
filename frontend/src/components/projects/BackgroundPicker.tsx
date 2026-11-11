import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AiOutlineCheck, AiOutlineClose, AiOutlineEllipsis, AiOutlineLeft, AiOutlineSearch, AiOutlineUpload } from "react-icons/ai";
import AnchoredPopover from "../ui/AnchoredPopover";
import { useToast } from "../ui/Toast";
import { getErrorMessage, getStatus } from "../../api/client";
import { useMyBackgrounds, useUploadBackground } from "../../hooks/useBackgrounds";
import { trackUnsplashDownload, useUnsplashPhotos, type UnsplashPhoto } from "../../hooks/useUnsplash";
import { BOARD_GRADIENTS, backgroundCss } from "../../utils/boardBackgrounds";

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

/** Ảnh Unsplash: hiện tên tác giả khi rê chuột (ghi công theo yêu cầu của Unsplash). */
const UnsplashTile = ({ photo, selected, onPick, className }: { photo: UnsplashPhoto; selected: boolean; onPick: () => void; className: string }) => (
  <div className={`relative group rounded-md overflow-hidden ${className}`} style={{ background: photo.color ?? "#ddd" }}>
    <button
      type="button"
      onClick={onPick}
      aria-label={`Ảnh của ${photo.author}${photo.alt ? `: ${photo.alt}` : ""}`}
      aria-pressed={selected}
      className={`w-full h-full bg-cover bg-center hover:brightness-90 transition flex items-center justify-center text-white ${
        selected ? "ring-2 ring-inset ring-primary" : ""
      }`}
      style={{ backgroundImage: `url("${photo.thumb}")` }}
    >
      {selected && <AiOutlineCheck className="text-lg drop-shadow" />}
    </button>
    <a
      href={photo.author_url}
      target="_blank"
      rel="noreferrer"
      className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 text-[10px] text-white bg-black/50 truncate opacity-0 group-hover:opacity-100 transition"
    >
      {photo.author}
    </a>
  </div>
);

/**
 * Chọn phông nền như Trello: hàng chọn nhanh + nút ⋯ mở "Phông nền bảng"
 * (Ảnh từ Unsplash, Màu sắc, tải ảnh của bạn). "Xem thêm" mở danh sách Unsplash có tìm kiếm.
 */
const BackgroundPicker = ({ value, onChange }: BackgroundPickerProps) => {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [view, setView] = useState<"main" | "unsplash">("main");
  const [allColors, setAllColors] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  // Gõ xong 400ms mới tìm, tránh gọi API theo từng ký tự
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const featured = useUnsplashPhotos("");
  const searched = useUnsplashPhotos(query);
  const featuredPhotos = featured.data?.pages[0]?.results ?? [];
  const notConfigured = getStatus(featured.error) === 503;

  const { data: uploads = [] } = useMyBackgrounds();
  const upload = useUploadBackground();

  const pickPhoto = (photo: UnsplashPhoto) => {
    onChange(photo.full);
    trackUnsplashDownload(photo);
  };

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

  // Hàng chọn nhanh: 3 ảnh Unsplash + 2 màu, luôn kèm lựa chọn hiện tại
  const quick: Array<{ value: string; css: string; label: string; photo?: UnsplashPhoto }> = [
    ...featuredPhotos.slice(0, 3).map((p) => ({ value: p.full, css: `url("${p.thumb}") center / cover`, label: `Ảnh của ${p.author}`, photo: p })),
    ...COLORS.map((c) => ({ value: c.value, css: backgroundCss(c.value), label: c.label })),
  ].slice(0, 5);
  if (!quick.some((q) => q.value === value)) {
    quick[quick.length - 1] = { value, css: backgroundCss(value, { thumb: true }), label: "Đang chọn" };
  }

  const close = () => {
    setAnchor(null);
    setView("main");
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

  const searchedPhotos = searched.data?.pages.flatMap((p) => p.results) ?? [];

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
            onClick={() => (q.photo ? pickPhoto(q.photo) : onChange(q.value))}
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
            {!notConfigured && (
              <button type="button" className="btn btn-xs" onClick={() => setView("unsplash")}>
                Xem thêm
              </button>
            )}
          </div>
          {notConfigured ? (
            <p className="text-xs text-base-content/60 bg-base-200 rounded-md p-2 mb-4">
              Chưa kết nối Unsplash. Quản trị viên cần thêm <code>UNSPLASH_ACCESS_KEY</code> vào <code>backend/.env</code>.
            </p>
          ) : featured.isLoading ? (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-md" />
              ))}
            </div>
          ) : featured.isError ? (
            <p className="text-xs text-error mb-4">{getErrorMessage(featured.error, "Không tải được ảnh Unsplash.")}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {featuredPhotos.slice(0, 6).map((p) => (
                <UnsplashTile key={p.id} photo={p} selected={p.full === value} onPick={() => pickPhoto(p)} className="h-14" />
              ))}
            </div>
          )}

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

      {anchor && view === "unsplash" && (
        <AnchoredPopover anchor={anchor} onClose={close} width={340} label="Ảnh của Unsplash">
          {header(
            <>
              Ảnh của{" "}
              <a href="https://unsplash.com/?utm_source=h_task&utm_medium=referral" target="_blank" rel="noreferrer" className="link link-primary">
                Unsplash
              </a>
            </>,
            () => setView("main")
          )}
          <label className="input input-bordered input-sm w-full flex items-center gap-2 mb-3">
            <AiOutlineSearch className="text-base-content/50" />
            <input
              className="grow"
              placeholder="Ảnh (vd. núi, biển, thành phố)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </label>
          <div className="max-h-[420px] overflow-y-auto pr-1">
            {searched.isLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-md" />
                ))}
              </div>
            ) : searched.isError ? (
              <p className="text-sm text-error">{getErrorMessage(searched.error, "Không tải được ảnh Unsplash.")}</p>
            ) : searchedPhotos.length === 0 ? (
              <p className="text-sm text-base-content/60 text-center py-6">Không tìm thấy ảnh phù hợp.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {searchedPhotos.map((p) => (
                    <UnsplashTile key={p.id} photo={p} selected={p.full === value} onPick={() => pickPhoto(p)} className="h-20" />
                  ))}
                </div>
                {searched.hasNextPage && (
                  <button
                    type="button"
                    className="btn btn-sm w-full mt-3"
                    onClick={() => searched.fetchNextPage()}
                    disabled={searched.isFetchingNextPage}
                  >
                    {searched.isFetchingNextPage && <span className="loading loading-spinner loading-xs" />}
                    Tải thêm ảnh
                  </button>
                )}
              </>
            )}
          </div>
        </AnchoredPopover>
      )}
    </div>
  );
};

export default BackgroundPicker;
