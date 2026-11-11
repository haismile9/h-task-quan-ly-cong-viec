import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const alertClass: Record<ToastType, string> = {
  success: "alert-success",
  error: "alert-error",
  info: "alert-info",
  warning: "alert-warning",
};

let nextId = 1;

/** Thông báo nổi góc trên phải, thay cho alert(). */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const api: ToastApi = {
    success: (m) => show("success", m),
    error: (m) => show("error", m),
    info: (m) => show("info", m),
    warning: (m) => show("warning", m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast toast-top toast-end z-[1000]">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`alert ${alertClass[t.type]} shadow-lg`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  return ctx;
};
