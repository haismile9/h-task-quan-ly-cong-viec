import { Link, useNavigate } from "react-router-dom";
import { AiOutlineArrowLeft, AiOutlineHome } from "react-icons/ai";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-board flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-sm p-8 text-center">
        <p className="text-6xl font-extrabold text-primary mb-2">404</p>
        <h1 className="text-xl font-bold mb-2">Không tìm thấy trang</h1>
        <p className="text-sm text-base-content/60 mb-6">
          Trang bạn tìm có thể đã bị xoá, đổi địa chỉ, hoặc bạn không có quyền truy cập.
        </p>
        <div className="flex flex-col gap-2">
          <Link to="/dashboard" className="btn btn-primary">
            <AiOutlineHome /> Về trang tổng quan
          </Link>
          <button onClick={() => navigate(-1)} className="btn btn-ghost">
            <AiOutlineArrowLeft /> Quay lại trang trước
          </button>
        </div>
      </div>
    </div>
  );
}
