<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            ->get();

        return response()->json([
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

    // ✏️ Tạo task
    $task = Task::create([
        'project_id' => $projectId,
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

    // Gán lại danh sách thực hiện nếu có
    if (!empty($assignedIds)) {
        $task->assignedUsers()->sync($assignedIds);
    }

    return response()->json(
        $task->load('assignedUsers:id,name,email')
    );
    
}


    public function destroy($id)
    {
        $user = Auth::user();
        $task = Task::with('project.users')->findOrFail($id);
        $project = $task->project;

        if ($user->role !== 'admin' && $project->owner_id !== $user->id) {
            return response()->json(['message' => 'Không có quyền xóa task này'], 403);
        }

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
        ->with('project:id,name') // Load tên project
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




    /** Thành viên dự án gồm người trong project_user và chủ dự án (dữ liệu cũ có thể thiếu chủ trong bảng). */
    private function isProjectMember(Project $project, int $userId): bool
    {
        return $project->owner_id === $userId || $project->users->contains('id', $userId);
    }
}
