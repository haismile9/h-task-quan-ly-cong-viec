<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/** Đọc nhật ký hoạt động: của tôi, của một thẻ, của một bảng. Phân trang bằng ?before=<id>. */
class ActivityController extends Controller
{
    private const PAGE = 20;

    /** Hoạt động của người đang đăng nhập (trang "Hoạt động" trong Cài đặt cá nhân). */
    public function mine(Request $request)
    {
        return $this->page(Activity::where('user_id', Auth::id()), $request);
    }

    /** Hoạt động của một thẻ (cột "Bình luận và hoạt động"). */
    public function forTask(Request $request, $taskId)
    {
        $task = Task::with('project')->findOrFail($taskId);
        $this->authorizeMember($task->project);

        return $this->page(Activity::where('task_id', $task->id), $request);
    }

    /** Hoạt động của cả bảng. */
    public function forProject(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeMember($project);

        return $this->page(Activity::where('project_id', $project->id), $request);
    }

    private function page($query, Request $request)
    {
        $items = $query
            ->when($request->integer('before'), fn ($q, $before) => $q->where('id', '<', $before))
            ->with(['user', 'project'])
            ->orderByDesc('id')
            ->limit(self::PAGE + 1)
            ->get();

        return response()->json([
            'data' => $items->take(self::PAGE)->values(),
            'has_more' => $items->count() > self::PAGE,
        ]);
    }

    private function authorizeMember(?Project $project): void
    {
        $user = Auth::user();
        abort_unless(
            $project && ($user->role === 'admin' || $project->owner_id === $user->id
                || $project->users()->where('user_id', $user->id)->exists()),
            403,
            'Bạn không thuộc dự án này'
        );
    }
}
