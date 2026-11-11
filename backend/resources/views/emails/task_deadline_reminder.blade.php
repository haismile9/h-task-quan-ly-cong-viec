@php
    $statusLabels = ['pending' => 'Chờ làm', 'in_progress' => 'Đang làm', 'done' => 'Hoàn thành'];
    $projectUrl = rtrim(config('app.frontend_url'), '/') . '/projects/' . $task->project_id;
    $deadline = \Illuminate\Support\Carbon::parse($task->deadline);
@endphp
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nhắc nhở hạn chót</title>
</head>
<body style="margin:0;padding:0;background:#f1f2f4;font-family:Arial,Helvetica,sans-serif;color:#172b4d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f2f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0c66e4;padding:20px 32px;color:#ffffff;font-size:22px;font-weight:bold;">H-Task</td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 4px;font-size:13px;color:#c9372c;font-weight:bold;">⏰ Sắp đến hạn chót</p>
              <p style="margin:0 0 16px;font-size:20px;font-weight:bold;line-height:1.35;">{{ $task->title }}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
                @if ($task->project)
                <tr><td style="color:#626f86;padding:2px 16px 2px 0;">Dự án</td><td>{{ $task->project->name }}</td></tr>
                @endif
                <tr><td style="color:#626f86;padding:2px 16px 2px 0;">Hạn chót</td><td><strong>{{ $deadline->format('d/m/Y') }}</strong></td></tr>
                <tr><td style="color:#626f86;padding:2px 16px 2px 0;">Trạng thái</td><td>{{ $statusLabels[$task->status] ?? $task->status }}</td></tr>
              </table>
              <a href="{{ $projectUrl }}"
                 style="display:inline-block;background:#0c66e4;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:10px 20px;border-radius:6px;">
                Mở bảng công việc
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #dcdfe4;font-size:12px;color:#626f86;">
              Bạn nhận được thư này vì được giao nhiệm vụ trên H-Task.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
