import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface AnchoredPopoverProps {
  /** Phần tử đã mở popover; popover đặt ngay dưới (hoặc trên nếu thiếu chỗ). */
  anchor: HTMLElement;
  onClose: () => void;
  width?: number;
  label: string;
  className?: string;
  children: ReactNode;
}

const MARGIN = 8;

/**
 * Popover nổi (portal ra body) bám theo một phần tử: không bị modal cắt,
 * đóng khi bấm ra ngoài hoặc nhấn Esc (Esc không lan tới modal phía sau).
 */
const AnchoredPopover = ({ anchor, onClose, width = 288, label, className = "p-3", children }: AnchoredPopoverProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.getBoundingClientRect();
      const h = ref.current?.offsetHeight ?? 320;
      const left = Math.min(Math.max(MARGIN, a.left), window.innerWidth - width - MARGIN);
      const below = a.bottom + 4;
      const top = below + h > window.innerHeight - MARGIN ? Math.max(MARGIN, a.top - h - 4) : below;
      setPos({ top, left });
    };
    place();
    // Nội dung đổi chiều cao (vd. gán thêm người) thì tính lại vị trí
    const ro = new ResizeObserver(place);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, width]);

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

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      data-popover=""
      className={`fixed z-[1100] bg-base-100 rounded-box shadow-xl border border-base-300 overflow-hidden ${className}`}
      style={{ width, top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
    >
      {children}
    </div>,
    document.body
  );
};

export default AnchoredPopover;
