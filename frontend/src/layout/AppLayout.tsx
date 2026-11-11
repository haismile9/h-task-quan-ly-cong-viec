import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import SideNav from "./SideNav";

/** Khung sau đăng nhập: thanh trên cùng + nội dung (trang bảng tự chiếm toàn bộ). */
const AppLayout = () => (
  <div className="min-h-screen flex flex-col bg-base-100">
    <TopNav />
    <main className="flex-1 flex flex-col min-h-0">
      <Outlet />
    </main>
  </div>
);

/** Các trang nội dung thường: menu trái + nội dung giữa (giống trang "Bảng"). */
export const SidebarLayout = () => (
  <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">
    <SideNav />
    <div className="flex-1 min-w-0">
      <Outlet />
    </div>
  </div>
);

export default AppLayout;
