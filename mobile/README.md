# H-Task Mobile (Flutter)

Ứng dụng di động của H-Task cho Android và iOS. App gọi chung REST API Laravel với bản web (`backend/`), đăng nhập bằng token Sanctum.

## Chạy thử

```bash
cd mobile
flutter pub get

# Bật máy ảo Android (hoặc cắm điện thoại có bật USB debugging)
flutter emulators --launch Pixel_8

# Bản debug mặc định gọi backend ở máy: http://10.0.2.2:8000/api
# (10.0.2.2 = máy tính của bạn khi nhìn từ máy ảo Android; chạy `php artisan serve` trước)
flutter run

# Điện thoại thật cùng Wi-Fi → dùng IP LAN của máy tính
flutter run --dart-define=API_URL=http://192.168.1.10:8000/api
```

Bản release mặc định gọi `https://htask-api.haismile.dev/api`. Tên miền này chưa được trỏ tới máy chủ nào, nên cần sửa trong `lib/core/env.dart` (hoặc truyền `--dart-define=API_URL=...`) khi đã deploy backend.

Với điện thoại thật, backend cần chạy `php artisan serve --host=0.0.0.0` để máy khác trong mạng truy cập được. Bản debug đã cho phép gọi `http://`; bản release chỉ gọi `https://`.

Máy ảo báo `INSTALL_FAILED_INSUFFICIENT_STORAGE` (APK debug ~200 MB)? Cài bản profile nhỏ hơn (~40 MB), vẫn gọi được backend ở máy:

```bash
flutter build apk --profile --target-platform android-x64 --dart-define=API_URL=http://10.0.2.2:8000/api
adb install -r build/app/outputs/flutter-apk/app-profile.apk
```

Yêu cầu: Flutter 3.24+, Android Studio (JDK 21), Android 6.0 (API 23) trở lên. Build iOS cần máy Mac có Xcode.

## Deep link lời mời

App mở được link `htask://app/invite/<token>` (Android intent-filter, iOS `CFBundleURLTypes`). Thử trên máy ảo:

```bash
adb shell am start -a android.intent.action.VIEW -d "htask://app/invite/<token>" dev.haismile.htask
```

Email mời hiện gửi link web `{FRONTEND_URL}/invite/<token>`. Muốn bấm link https trong email mà mở thẳng app thì cần
App Links (Android) / Universal Links (iOS) trên tên miền frontend thật — làm khi đã deploy.

## Thư viện

| Việc | Thư viện |
|---|---|
| Gọi API, tự gắn token, xử lý 401 | `dio` |
| Trạng thái và cache dữ liệu | `flutter_riverpod` |
| Điều hướng, thanh tab, chuyển hướng khi chưa đăng nhập | `go_router` |
| Lưu token an toàn (Keychain / Keystore) | `flutter_secure_storage` |
| Ảnh nền bảng | `cached_network_image` |
| Ngày giờ tiếng Việt | `intl`, `flutter_localizations` |

## Cấu trúc

```
lib/
├── core/          env, api_client, theme, router, backgrounds (gradient khớp bản web)
├── models/        user, project (… list, task, comment ở các bước sau)
├── widgets/       avatar (cùng bảng màu với bản web)
└── features/
    ├── auth/      đăng nhập, khôi phục phiên, đăng xuất
    ├── shell/     thanh tab dưới: Bảng · Việc của tôi · Hoạt động · Tài khoản
    ├── projects/  danh sách bảng
    └── account/   tài khoản
```

## Lộ trình

| Bước | Nội dung | Trạng thái |
|---|---|---|
| 1 | Khung app, theme sáng/tối, `ApiClient`, đăng nhập và tự đăng xuất khi gặp 401, thanh tab, danh sách bảng (tìm kiếm, kéo xuống để làm mới) | ✅ Xong |
| 2 | Bảng Kanban chỉ đọc: các cột vuốt ngang trên nền bảng, thẻ có độ ưu tiên, hạn chót, người được giao, dấu hoàn thành; lọc theo từ khoá / thẻ của tôi / độ ưu tiên | ✅ Xong |
| 3 | Thao tác trên bảng: thêm thẻ nhanh, tick hoàn thành, kéo thả thẻ (nhấn giữ; kéo tới mép màn hình để sang cột bên cạnh), thêm/đổi tên/xoá/sắp xếp cột, tạo bảng, menu bảng (mô tả, đổi tên, hình nền, xoá), gắn sao bảng | ✅ Xong |
| 4 | Chi tiết thẻ: sửa tiêu đề, mô tả, độ ưu tiên, hạn chót, giao thành viên, chuyển danh sách, xoá thẻ, bình luận và dòng hoạt động | ✅ Xong |
| 5 | Tab Việc của tôi (chia nhóm theo hạn, tick ngay), Hoạt động (tải thêm khi cuộn), Tài khoản: tổng quan + tiến độ bảng, sửa họ tên, đổi mật khẩu, email nhắc hạn, giao diện Sáng/Tối/Hệ thống | ✅ Xong |
| 6 | Ô "Ghi nhớ đăng nhập" (nhớ email, bỏ chọn = không lưu phiên), đăng ký + xác minh mã email, quên mật khẩu (3 bước), chia sẻ bảng (mời bằng email, gỡ thành viên, huỷ lời mời), nhận lời mời qua deep link `htask://app/invite/<token>` | ✅ Xong |
| 7 | Thông báo đẩy (FCM): thêm bảng `device_tokens` và endpoint `POST /devices` ở backend | ⏳ |
| 8 | Phát hành: icon, splash, ký APK/AAB, đưa lên Google Play (và App Store nếu có Mac) | ⏳ |
