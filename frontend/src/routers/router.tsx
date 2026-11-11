import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout, { SidebarLayout } from "../layout/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import ProjectList from "../pages/ProjectList";
import ProjectDetails from "../pages/ProjectDetails";
import MyTasks from "../pages/MyTasks";
import Account from "../pages/Account";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import VerifyEmailForm from "../components/auth/VerifyEmailForm";
import AcceptInvitation from "../pages/AcceptInvitation";

const router = createBrowserRouter([
  // Không cần đăng nhập
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-email", element: <VerifyEmailForm /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/invite/:token", element: <AcceptInvitation /> },
  { path: "/404", element: <NotFound /> },

  // Cần đăng nhập
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      // Trang nội dung: có menu trái
      {
        element: <SidebarLayout />,
        children: [
          { path: "projects", element: <ProjectList /> },
          { path: "my-task", element: <MyTasks /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "account", element: <Account /> },
        ],
      },
      // Trang bảng: chiếm toàn màn hình
      { path: "projects/:id", element: <ProjectDetails /> },
    ],
  },

  { path: "*", element: <NotFound /> },
]);

export default router;
