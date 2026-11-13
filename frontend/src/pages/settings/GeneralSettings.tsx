import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";

type EmailSetting = "email_deadline_reminders" | "email_project_added";

/** Các email thông báo người dùng được bật/tắt. Mã xác minh luôn gửi nên không có ở đây. */
const EMAIL_SETTINGS: { key: EmailSetting; label: string; hint: string }[] = [
  {
    key: "email_deadline_reminders",
    label: "Thẻ của tôi sắp đến hạn",
    hint: "Thẻ được giao cho bạn đến hạn hôm nay hoặc ngày mai mà chưa hoàn thành. Gửi lúc 8:00 sáng.",
  },
  {
    key: "email_project_added",
    label: "Có người thêm tôi vào dự án",
    hint: "Email kèm đường dẫn mở dự án đó.",
  },
];

/** Trang "Cài đặt": ngôn ngữ, thông báo bằng email, phiên đăng nhập. */
const GeneralSettings = () => {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();

  // Lạc quan: công tắc đổi ngay khi bấm, lỗi thì trả lại giá trị cũ.
  const saveSettings = useMutation({
    mutationFn: ({ key, value }: { key: EmailSetting; value: boolean }) => authApi.updateSettings({ [key]: value }),
    onMutate: ({ key, value }) => {
      const previous = user;
      if (user) setUser({ ...user, [key]: value });
      return { previous };
    },
    onSuccess: (u) => {
      setUser(u);
      toast.success("Đã lưu cài đặt");
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) setUser(ctx.previous);
      toast.error(getErrorMessage(err, "Không lưu được cài đặt."));
    },
  });

  if (!user) return null;
  // Chỉ khoá công tắc đang lưu, công tắc còn lại vẫn bấm được
  const savingKey = saveSettings.isPending ? saveSettings.variables?.key : undefined;

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Cài đặt</h1>

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
        <p className="text-sm text-base-content/70 mb-1">
          Email chứa mã xác minh (đăng ký, quên mật khẩu) luôn được gửi để bảo vệ tài khoản.
        </p>
        <p className="text-sm font-semibold mt-4 mb-3">Gửi email cho tôi khi:</p>
        <div className="space-y-5">
          {EMAIL_SETTINGS.map((s) => (
            <label key={s.key} className="flex items-start gap-3 cursor-pointer max-w-xl">
              <input
                type="checkbox"
                className="toggle toggle-primary mt-0.5"
                checked={user[s.key] !== false}
                disabled={savingKey === s.key}
                onChange={(e) => saveSettings.mutate({ key: s.key, value: e.target.checked })}
              />
              <span>
                <span className="font-medium">{s.label}</span>
                <span className="block text-sm text-base-content/60">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
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
