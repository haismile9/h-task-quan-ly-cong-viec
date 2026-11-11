<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Activity;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function index($projectId)
    {
        $user = Auth::user();
        $project = Project::with('users')->findOrFail($projectId);

        if ($project->owner_id !== $user->id && !$project->users->contains($user)) {
            return response()->json(['message' => 'Bạn không thuộc dự án này'], 403);
        }

        $tasks = Task::where('project_id', $projectId)
            ->with('assignedUsers:id,name,email')
            ->orderBy('position')
            ->get();

        return response()->json([
            'lists' => $project->lists()->get(),
            'tasks' => $tasks,
            'user' => [
                'id' => $user->id,
                'role' => $user->role,
            ]
        ]);
    }

    public function store(Request $request, $projectId)
{
    $user = Auth::user();
    $project = Project::with('users')->findOrFail($projectId);

    // Ai cũng có thể tạo task nếu họ thuộc dự án
    if ($project->owner_id !== $user->id && !$project->users->contains($user)) {
        return response()->json(['message' => 'Bạn không thuộc dự án này'], 403);
    }

    // Validate
    $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'status' => 'nullable|in:pending,in_progress,done',
        'list_id' => 'nullable|integer',
        'priority' => 'nullable|in:low,medium,high',
        'deadline' => 'nullable|date',
        'assigned_user_emails' => 'nullable|array',
        'assigned_user_emails.*' => 'email|exists:users,email',
        'assigned_user_ids' => 'nullable|array',
        'assigned_user_ids.*' => 'integer|exists:users,id',
    ]);

    $assignedIds = [];

    // 🎯 Xử lý gán theo email
    if ($request->has('assigned_user_emails')) {
        // Như Trello: mọi thành viên dự án đều được gán người (người được gán phải thuộc dự án).

        $assignedUsers = User::whereIn('email', $request->assigned_user_emails)->get();
        foreach ($assignedUsers as $assignedUser) {
            if (!$this->isProjectMember($project, $assignedUser->id)) {
                return response()->json(['message' => "User {$assignedUser->email} chưa tham gia dự án"], 403);
            }
            $assignedIds[] = $assignedUser->id;
        }
    }

    // 🔥 Xử lý gán theo ID (ưu tiên nếu dùng frontend mới)
    if ($request->has('assigned_user_ids')) {
        // Như Trello: mọi thành viên dự án đều được gán người (người được gán phải thuộc dự án).

        foreach ($request->assigned_user_ids as $userId) {
            if (!$this->isProjectMember($project, (int) $userId)) {
                return response()->json(['message' => "User ID {$userId} chưa tham gia dự án"], 403);
            }
            $assignedIds[] = $userId;
        }
    }

    // Danh sách đích: danh sách gửi lên (phải thuộc dự án) hoặc danh sách đầu tiên
    $list = $request->filled('list_id')
        ? $project->lists()->whereKey($request->list_id)->first()
        : $project->lists()->first();
    if (!$list) {
        return response()->json(['message' => 'Danh sách không tồn tại trong dự án'], 422);
    }

    // ✏️ Tạo task (thêm vào cuối danh sách)
    $task = Task::create([
        'project_id' => $projectId,
        'list_id' => $list->id,
        'position' => (int) Task::where('list_id', $list->id)->max('position') + 1,
        'title' => $request->title,
        'description' => $request->description,
        'status' => $request->status ?? 'pending',
        'priority' => $request->priority ?? 'medium',
        'deadline' => $request->deadline,
    ]);

    // 🧠 Gán user
    if (!empty($assignedIds)) {
        $task->assignedUsers()->sync($assignedIds);
    }

    Activity::record('card_created', $project, $task, ['list_name' => $list->name]);

    return response()->json($task->load('assignedUsers:id,name,email'), 201);
}


    public function show($id)
    {
        $user = Auth::user();
        $task = Task::with(['project', 'assignedUsers:id,name,email'])->findOrFail($id);

        if ($task->project->owner_id !== $user->id && !$task->project->users->contains($user)) {
            return response()->json(['message' => 'Bạn không thuộc dự án này'], 403);
        }

        return response()->json([
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status,
            'deadline' => $task->deadline,
            'assigned_users' => $task->assignedUsers,
            'project' => [
                'id' => $task->project->id,
                'name' => $task->project->name,
            ]
        ]);
    }

    public function update(Request $request, $taskId)
{
    $user = Auth::user();
    $task = Task::with('project.users')->findOrFail($taskId);
    $project = $task->project;

    if ($project->owner_id !== $user->id && !$project->users->contains($user)) {
        return response()->json(['message' => 'Bạn không thuộc dự án này'], 403);
    }

    // Validate input
    $request->validate([
        'title' => 'nullable|string|max:255',
        'description' => 'nullable|string',
        'status' => 'nullable|in:pending,in_progress,done',
        'priority' => 'nullable|in:low,medium,high',
        'deadline' => 'nullable|date',
        'assigned_user_emails' => 'nullable|array',
        'assigned_user_emails.*' => 'email|exists:users,email',
        'assigned_user_ids' => 'nullable|array',
        'assigned_user_ids.*' => 'integer|exists:users,id',
    ]);

    // Giá trị cũ để ghi hoạt động
    $before = $task->only(['title', 'status', 'deadline']);
    $beforeAssignees = $task->assignedUsers()->pluck('users.id')->all();

    // Cập nhật thông tin cơ bản
    $task->update($request->only(['title', 'description', 'status', 'priority', 'deadline']));

    $assignedIds = [];

    // 🎯 Nếu có assigned_user_emails
    if ($request->has('assigned_user_emails')) {
        // Như Trello: mọi thành viên dự án đều được gán người (người được gán phải thuộc dự án).

        $assignedUsers = User::whereIn('email', $request->assigned_user_emails)->get();
        foreach ($assignedUsers as $assignedUser) {
            if (!$this->isProjectMember($project, $assignedUser->id)) {
                return response()->json(['message' => "User {$assignedUser->email} chưa tham gia dự án"], 403);
            }
            $assignedIds[] = $assignedUser->id;
        }

    }

    // 🔥 Nếu có assigned_user_ids
    if ($request->has('assigned_user_ids')) {
        // Như Trello: mọi thành viên dự án đều được gán người (người được gán phải thuộc dự án).

        foreach ($request->assigned_user_ids as $userId) {
            if (!$this->isProjectMember($project, (int) $userId)) {
                return response()->json(['message' => "User ID {$userId} chưa tham gia dự án"], 403);
            }
            $assignedIds[] = $userId;
        }
    }

    // Gán lại danh sách thực hiện khi client gửi lên (kể cả mảng rỗng = bỏ gán tất cả)
    if ($request->has('assigned_user_ids') || $request->has('assigned_user_emails')) {
        $task->assignedUsers()->sync($assignedIds);
    }

    $this->logTaskChanges($task, $before, $beforeAssignees, $assignedIds, $request);

    return response()->json(
        $task->load('assignedUsers:id,name,email')
    );
    
}


    public function destroy($id)
    {
        $user = Auth::user();
        $task = Task::with('project.users')->findOrFail($id);
        $project = $task->project;

        // Như Trello: mọi thành viên dự án đều xoá được thẻ
        if ($user->role !== 'admin' && !$this->isProjectMember($project, $user->id)) {
            return response()->json(['message' => 'Bạn không thuộc dự án này'], 403);
        }

        Activity::record('card_deleted', $project, $task);
        $task->delete();

        return response()->json(['message' => 'Đã xóa task']);
    }

    public function dashboard()
    {
        $user = Auth::user();
        $tasks = Task::whereHas('assignedUsers', fn ($q) => $q->where('user_id', $user->id))
            ->with('project')
            ->get();

        return response()->json([
            'pending' => $tasks->where('status', 'pending'),
            'in_progress' => $tasks->where('status', 'in_progress'),
            'done' => $tasks->where('status', 'done'),
        ]);
    }
    public function myTasks(Request $request)
{
    $tasks = $request->user()->tasksAssigned()
        ->with(['project:id,name', 'list:id,name']) // Load tên project và danh sách
        ->get()
        ->map(fn($task) => [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status,
            'priority' => $task->priority,
            'deadline' => $task->deadline,
            'project_id' => $task->project_id,
            'project_name' => $task->project->name ?? 'Không rõ',
            'list_name' => $task->list->name ?? null,
        ]);

    return response()->json(['tasks' => $tasks]);
}

    /**
     * Get today's tasks for mobile app
     */
    public function todayTasks(Request $request)
    {
        $user = $request->user();
        $today = now()->startOfDay();
        $tomorrow = now()->addDay()->startOfDay();
        
        $tasks = Task::whereHas('assignedUsers', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where(function($query) use ($today, $tomorrow) {
                // Tasks due today or created today
                $query->whereBetween('deadline', [$today, $tomorrow])
                      ->orWhereBetween('created_at', [$today, $tomorrow]);
            })
            ->with(['project:id,name', 'assignedUsers:id,name'])
            ->orderBy('deadline', 'asc')
            ->get()
            ->map(function($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'priority' => $task->priority ?? 'medium',
                    'due_date' => $task->deadline,
                    'created_at' => $task->created_at,
                    'updated_at' => $task->updated_at,
                    'assigned_user_id' => $user->id,
                    'project_id' => $task->project_id,
                    'project_name' => $task->project->name ?? 'Không rõ',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $tasks,
            'count' => $tasks->count(),
            'message' => 'Today\'s tasks retrieved successfully'
        ]);
    }

    /**
     * Get task statistics for dashboard
     */
    public function statistics(Request $request)
    {
        $user = $request->user();
        $today = now()->startOfDay();
        
        $allTasks = Task::whereHas('assignedUsers', function($query) use ($user) {
            $query->where('user_id', $user->id);
        });
        
        $stats = [
            'total_tasks' => $allTasks->count(),
            'pending_tasks' => $allTasks->where('status', 'pending')->count(),
            'in_progress_tasks' => $allTasks->where('status', 'in_progress')->count(),
            'completed_tasks' => $allTasks->where('status', 'done')->count(),
            'today_tasks' => $allTasks->whereDate('deadline', $today)->count(),
            'overdue_tasks' => $allTasks->where('deadline', '<', $today)
                                     ->where('status', '!=', 'done')->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'message' => 'Task statistics retrieved successfully'
        ]);
    }

    /**
     * Update task status for mobile app
     */
    public function updateStatus(Request $request, $taskId)
    {
        $user = $request->user();
        
        $request->validate([
            'status' => 'required|in:pending,in_progress,done'
        ]);

        $task = Task::whereHas('assignedUsers', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->findOrFail($taskId);

        $task->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'data' => $task,
            'message' => 'Task status updated successfully'
        ]);
    }




    /**
     * Di chuyển thẻ tới danh sách $list_id ở vị trí $position (0 = đầu danh sách),
     * đánh lại số thứ tự của danh sách cũ và danh sách mới.
     */
    public function move(Request $request, $id)
    {
        $data = $request->validate([
            'list_id' => 'required|integer',
            'position' => 'required|integer|min:0',
        ]);

        $user = Auth::user();
        $task = Task::with('project.users')->findOrFail($id);
        $project = $task->project;
        if (!$this->isProjectMember($project, $user->id) && $user->role !== 'admin') {
            return response()->json(['message' => 'Bạn không thuộc dự án này'], 403);
        }
        $target = $project->lists()->whereKey($data['list_id'])->first();
        if (!$target) {
            return response()->json(['message' => 'Danh sách không tồn tại trong dự án'], 422);
        }

        $fromList = $task->list;

        DB::transaction(function () use ($task, $target, $data) {
            $oldListId = $task->list_id;

            // Danh sách đích (không tính thẻ đang di chuyển), chèn thẻ vào vị trí mới
            $ids = Task::where('list_id', $target->id)->where('id', '!=', $task->id)
                ->orderBy('position')->pluck('id')->all();
            array_splice($ids, min($data['position'], count($ids)), 0, [$task->id]);

            $task->update(['list_id' => $target->id]);
            foreach ($ids as $pos => $taskId) {
                Task::whereKey($taskId)->update(['position' => $pos]);
            }

            // Đánh số lại danh sách cũ nếu thẻ rời đi
            if ($oldListId && $oldListId !== $target->id) {
                Task::where('list_id', $oldListId)->orderBy('position')->pluck('id')
                    ->each(fn ($taskId, $pos) => Task::whereKey($taskId)->update(['position' => $pos]));
            }
        });

        if ($fromList && $fromList->id !== $target->id) {
            Activity::record('card_moved', $project, $task, ['from_list' => $fromList->name, 'to_list' => $target->name]);
        }

        return response()->json($task->fresh()->load('assignedUsers:id,name,email'));
    }

    /** Ghi các hoạt động sau khi sửa thẻ: đổi tên, hoàn thành/mở lại, đổi hạn, thêm/loại thành viên. */
    private function logTaskChanges(Task $task, array $before, array $beforeAssignees, array $assignedIds, Request $request): void
    {
        $project = $task->project;

        if ($request->has('title') && $before['title'] !== $task->title) {
            Activity::record('card_renamed', $project, $task, ['old_title' => $before['title']]);
        }
        if ($request->has('status') && $before['status'] !== $task->status) {
            $done = $task->status === 'done';
            if ($done || $before['status'] === 'done') {
                Activity::record($done ? 'card_completed' : 'card_reopened', $project, $task);
            }
        }
        if ($request->exists('deadline') && (string) $before['deadline'] !== (string) $task->deadline) {
            Activity::record('card_due_changed', $project, $task, ['deadline' => $task->deadline]);
        }
        if ($request->has('assigned_user_ids') || $request->has('assigned_user_emails')) {
            $assignedIds = array_map('intval', $assignedIds);
            $added = array_diff($assignedIds, $beforeAssignees);
            $removed = array_diff($beforeAssignees, $assignedIds);
            $names = User::whereIn('id', array_merge($added, $removed))->pluck('name', 'id');
            foreach ($added as $id) {
                Activity::record('card_member_added', $project, $task, ['member_id' => $id, 'member_name' => $names[$id] ?? '']);
            }
            foreach ($removed as $id) {
                Activity::record('card_member_removed', $project, $task, ['member_id' => $id, 'member_name' => $names[$id] ?? '']);
            }
        }
    }

    /** Thành viên dự án gồm người trong project_user và chủ dự án (dữ liệu cũ có thể thiếu chủ trong bảng). */
    private function isProjectMember(Project $project, int $userId): bool
    {
        return $project->owner_id === $userId || $project->users->contains('id', $userId);
    }
}
