import { useMutation } from "@tanstack/react-query";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { authApi } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";

/** Trang "Cài đặt": ngôn ngữ, thông báo bằng email, phiên đăng nhập. */
const GeneralSettings = () => {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();

  const saveSettings = useMutation({
    mutationFn: (enabled: boolean) => authApi.updateSettings({ email_deadline_reminders: enabled }),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Đã lưu cài đặt");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không lưu được cài đặt.")),
  });

  if (!user) return null;
  const remindersOn = user.email_deadline_reminders !== false;

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Cài đặt</h1>

      <div className="alert alert-info alert-soft mb-10">
        <AiOutlineInfoCircle className="text-xl" />
        <span>Đổi tên và mật khẩu ở mục “Hồ sơ và khả năng hiển thị”.</span>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Ngôn ngữ và khu vực</h2>
        <p className="text-sm text-base-content/70 mb-2">Ngôn ngữ hiển thị</p>
        <select className="select select-bordered select-sm w-60" value="vi" disabled aria-label="Ngôn ngữ">
          <option value="vi">Tiếng Việt</option>
        </select>
        <p className="text-xs text-base-content/50 mt-2">Hiện H-Task chỉ hỗ trợ tiếng Việt. Ngày giờ hiển thị theo định dạng DD/MM/YYYY.</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Thông báo bằng email</h2>
        <p className="text-sm text-base-content/70 mb-4">
          Bạn luôn nhận email về lời mời tham gia dự án và mã xác minh. Các thông báo khác có thể bật hoặc tắt bên dưới.
        </p>
        <label className="flex items-start gap-3 cursor-pointer max-w-xl">
          <input
            type="checkbox"
            className="toggle toggle-primary mt-0.5"
            checked={remindersOn}
            disabled={saveSettings.isPending}
            onChange={(e) => saveSettings.mutate(e.target.checked)}
          />
          <span>
            <span className="font-medium">Nhắc hạn chót</span>
            <span className="block text-sm text-base-content/60">
              Gửi email khi thẻ bạn được giao sắp đến hạn (hôm nay hoặc ngày mai) mà chưa hoàn thành.
            </span>
          </span>
        </label>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Phiên đăng nhập</h2>
        <p className="text-sm text-base-content/70 mb-3">Đăng xuất khỏi H-Task trên trình duyệt này.</p>
        <button className="btn btn-outline btn-error btn-sm" onClick={() => logout()}>
          Đăng xuất
        </button>
      </section>
    </>
  );
};

export default GeneralSettings;
