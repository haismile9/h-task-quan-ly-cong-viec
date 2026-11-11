<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Một danh sách (cột) trên bảng của dự án. */
class TaskList extends Model
{
    protected $fillable = ['project_id', 'name', 'position'];

    protected $casts = ['position' => 'integer'];

    /** Danh sách mặc định khi tạo dự án mới. */
    public const DEFAULT_NAMES = ['Cần làm', 'Đang làm', 'Hoàn thành'];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'list_id')->orderBy('position');
    }
}
