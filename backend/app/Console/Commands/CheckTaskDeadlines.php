<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Task;
use App\Models\User;
use App\Mail\TaskDeadlineReminderMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class CheckTaskDeadlines extends Command
{
    protected $signature = 'check:task-deadlines';
    protected $description = 'Gửi mail nhắc nhở các task gần đến deadline hoặc trễ deadline';

    public function handle()
    {
        // deadline chỉ có ngày: so theo ngày (hôm nay và ngày mai), không so với giờ hiện tại
        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();

        $tasks = Task::whereNotNull('deadline')
            ->where('status', '!=', 'done')
            ->whereBetween('deadline', [$today, $tomorrow])
            ->with(['assignedUsers', 'project'])
            ->get();

        foreach ($tasks as $task) {
            // Người được gán qua giao diện nằm ở bảng task_user; vẫn giữ cột cũ assigned_to
            $recipients = $task->assignedUsers;
            if ($task->assigned_to && !$recipients->contains('id', $task->assigned_to)) {
                if ($legacy = User::find($task->assigned_to)) {
                    $recipients->push($legacy);
                }
            }

            foreach ($recipients as $user) {
                // Bỏ qua người đã tắt "Nhận email nhắc hạn chót" trong Cài đặt
                if (!$user->email || !$user->email_deadline_reminders) {
                    continue;
                }
                Mail::to($user->email)->send(new TaskDeadlineReminderMail($task));
                $this->info("📧 Gửi mail nhắc: {$user->email} - Task: {$task->title}");
            }
        }

        $this->info('✅ Quét xong deadline.');
    }
}
