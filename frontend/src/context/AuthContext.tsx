import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TOKEN_KEY, setUnauthorizedHandler } from "../api/client";
import { authApi } from "../api/auth";
import type { User } from "../types";

interface AuthContextType {
  token: string | null;
  user: User | null;
  /** true cho tới khi đã kiểm tra xong token lưu sẵn và tải user. */
  isLoading: boolean;
  /** Lưu token sau khi đăng nhập/xác minh email; truyền user nếu backend đã trả về. */
  login: (token: string, user?: User) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // Token hết hạn ở bất kỳ request nào → xoá phiên, ProtectedRoute sẽ chuyển về /login.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Có token lưu sẵn khi mở app → tải thông tin user.
  useEffect(() => {
    if (!token || user) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    authApi
      .me()
      .then((u) => !cancelled && setUser(u))
      .catch(() => !cancelled && clearSession())
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, user, clearSession]);

  const login = useCallback(async (newToken: string, newUser?: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setUser(newUser ?? null);
    setToken(newToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Token có thể đã hết hạn; vẫn xoá phiên phía client.
    }
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
};
