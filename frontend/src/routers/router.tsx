import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout, { SidebarLayout } from "../layout/AppLayout";
import SettingsLayout from "../layout/SettingsLayout";
import ProfileSettings from "../pages/settings/ProfileSettings";
import ActivitySettings from "../pages/settings/ActivitySettings";
import CardsSettings from "../pages/settings/CardsSettings";
import GeneralSettings from "../pages/settings/GeneralSettings";
import ProtectedRoute from "../components/ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import ProjectList from "../pages/ProjectList";
import ProjectDetails from "../pages/ProjectDetails";
import MyTasks from "../pages/MyTasks";
import Planner from "../pages/Planner";
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
          { path: "planner", element: <Planner /> },
          { path: "dashboard", element: <Dashboard /> },
        ],
      },
      // Cài đặt cá nhân: menu trái riêng
      {
        path: "u",
        element: <SettingsLayout />,
        children: [
          { index: true, element: <Navigate to="/u/profile" replace /> },
          { path: "profile", element: <ProfileSettings /> },
          { path: "activity", element: <ActivitySettings /> },
          { path: "cards", element: <CardsSettings /> },
          { path: "settings", element: <GeneralSettings /> },
        ],
      },
      { path: "account", element: <Navigate to="/u/profile" replace /> },
      // Trang bảng: chiếm toàn màn hình
      { path: "projects/:id", element: <ProjectDetails /> },
    ],
  },

  { path: "*", element: <NotFound /> },
]);

export default router;
