import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./ui/LoadingSpinner";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading || (token && !user)) {
    return <LoadingSpinner message="Đang kiểm tra đăng nhập..." fullScreen />;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
