<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Một dòng nhật ký hoạt động. Các loại (type):
 *  project_created, member_added, member_invited,
 *  list_created, list_renamed, list_deleted,
 *  card_created, card_moved, card_completed, card_reopened, card_renamed, card_deleted,
 *  card_due_changed, card_member_added, card_member_removed, comment_added
 */
class Activity extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'project_id', 'task_id', 'type', 'data'];

    protected $casts = ['data' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class)->select(['id', 'name', 'email']);
    }

    public function project()
    {
        return $this->belongsTo(Project::class)->select(['id', 'name', 'background_url']);
    }

    /**
     * Ghi một hoạt động của người đang đăng nhập.
     * Truyền thẻ hoặc dự án để gắn ngữ cảnh; tên thẻ/dự án được lưu sẵn vào data.
     */
    public static function record(string $type, ?Project $project = null, ?Task $task = null, array $data = []): ?self
    {
        $userId = Auth::id();
        if (!$userId) {
            return null;
        }

        if ($task) {
            $data += ['task_title' => $task->title];
            $project ??= $task->project;
        }
        if ($project) {
            $data += ['project_name' => $project->name];
        }

        return static::create([
            'user_id' => $userId,
            'project_id' => $project?->id,
            'task_id' => $task?->id,
            'type' => $type,
            'data' => $data,
        ]);
    }
}
