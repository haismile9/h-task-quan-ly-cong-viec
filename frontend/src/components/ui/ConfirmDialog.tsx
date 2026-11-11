import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import Modal from "./Modal";

interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Tô đỏ nút xác nhận cho thao tác xoá. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Hộp xác nhận dùng chung, thay cho window.confirm(). */
export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Modal
          size="sm"
          title={options.title ?? "Xác nhận"}
          onClose={() => close(false)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => close(false)}>
                {options.cancelText ?? "Huỷ"}
              </button>
              <button
                className={`btn ${options.danger ? "btn-error" : "btn-primary"}`}
                onClick={() => close(true)}
                autoFocus
              >
                {options.confirmText ?? "Đồng ý"}
              </button>
            </>
          }
        >
          <p>{options.message}</p>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm phải được dùng bên trong <ConfirmProvider>");
  return ctx;
};
