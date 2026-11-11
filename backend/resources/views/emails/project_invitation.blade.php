<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lời mời tham gia dự án</title>
</head>
<body style="margin:0;padding:0;background:#f1f2f4;font-family:Arial,Helvetica,sans-serif;color:#172b4d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f2f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0c66e4;padding:20px 32px;color:#ffffff;font-size:22px;font-weight:bold;">
              H-Task
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:bold;line-height:1.35;">
                {{ $inviterName }} đã mời bạn tham gia dự án
                <span style="color:#0c66e4;">{{ $projectName }}</span>
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#44546f;">
                {{ $inviterEmail }} muốn cùng bạn quản lý công việc trên H-Task.
                Tạo tài khoản bằng chính email nhận thư này để vào dự án.
              </p>
              <a href="{{ $inviteUrl }}"
                 style="display:inline-block;background:#0c66e4;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:10px 20px;border-radius:6px;">
                Xem lời mời
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#626f86;">
                Nếu nút không hoạt động, hãy mở đường dẫn sau:<br>
                <a href="{{ $inviteUrl }}" style="color:#0c66e4;word-break:break-all;">{{ $inviteUrl }}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #dcdfe4;font-size:12px;color:#626f86;">
              Bạn nhận được thư này vì {{ $inviterName }} đã nhập email của bạn trên H-Task.
              Nếu không biết người này, bạn có thể bỏ qua thư.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
