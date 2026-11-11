<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $title }}</title>
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
              <p style="margin:0 0 8px;font-size:20px;font-weight:bold;line-height:1.35;">{{ $title }}</p>
              <p style="margin:0 0 24px;font-size:14px;color:#44546f;">{{ $intro }}</p>
              <div style="background:#e9f2ff;border-radius:8px;padding:16px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:10px;color:#0c66e4;">
                {{ $code }}
              </div>
              <p style="margin:24px 0 0;font-size:13px;color:#626f86;">
                Mã có hiệu lực trong 10 phút. Đừng chia sẻ mã này cho bất kỳ ai.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #dcdfe4;font-size:12px;color:#626f86;">
              Nếu bạn không yêu cầu mã này, hãy bỏ qua thư.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
