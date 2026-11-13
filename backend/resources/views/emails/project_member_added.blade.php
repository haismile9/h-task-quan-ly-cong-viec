<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bạn đã được thêm vào dự án</title>
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
              <p style="margin:0 0 16px;font-size:14px;color:#44546f;">Xin chào {{ $memberName }},</p>
              <p style="margin:0 0 8px;font-size:20px;font-weight:bold;line-height:1.35;">
                {{ $adderName }} đã thêm bạn vào dự án
                <span style="color:#0c66e4;">{{ $projectName }}</span>
              </p>
              @if ($projectDescription)
                <p style="margin:0 0 8px;font-size:14px;color:#44546f;">{{ $projectDescription }}</p>
              @endif
              <p style="margin:0 0 24px;font-size:14px;color:#44546f;">
                Bạn có thể xem bảng, nhận việc và bình luận ngay bây giờ.
              </p>
              <a href="{{ $projectUrl }}"
                 style="display:inline-block;background:#0c66e4;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:10px 20px;border-radius:6px;">
                Mở dự án
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#626f86;">
                Nếu nút không hoạt động, hãy mở đường dẫn sau:<br>
                <a href="{{ $projectUrl }}" style="color:#0c66e4;word-break:break-all;">{{ $projectUrl }}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #dcdfe4;font-size:12px;color:#626f86;">
              Bạn nhận được thư này vì {{ $adderName }} ({{ $adderEmail }}) đã thêm bạn vào một dự án trên H-Task.
              Nếu không muốn tham gia, hãy liên hệ chủ dự án để được gỡ khỏi dự án.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
