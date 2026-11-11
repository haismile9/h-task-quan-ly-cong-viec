import { useEffect, type ReactNode } from "react";

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Các nút ở chân modal (Huỷ, Lưu...). */
  actions?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" };

/** Khung modal dùng chung (daisyUI). Đóng khi bấm nền hoặc phím Esc. */
const Modal = ({ title, onClose, children, actions, size = "md" }: ModalProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className={`modal-box ${sizeClass[size]}`}>
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div className="space-y-3">{children}</div>
        {actions && <div className="modal-action">{actions}</div>}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default Modal;
