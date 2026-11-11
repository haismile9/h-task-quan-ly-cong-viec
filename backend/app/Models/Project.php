<?php
//Models/Project.php


namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Project extends Model
{
    use HasFactory;

    protected $fillable = [
    'name',
    'description',
    'owner_id',
    'background_url', // ✅ Cho phép gán ảnh nền
];


    protected $with = ['owner'];

    protected static function booted(): void
    {
        // Dự án mới có sẵn các danh sách mặc định, giống bảng Trello mới tạo.
        static::created(function (Project $project) {
            foreach (TaskList::DEFAULT_NAMES as $i => $name) {
                $project->lists()->create(['name' => $name, 'position' => $i]);
            }
        });
    }

    /** Các danh sách (cột) của bảng, theo thứ tự hiển thị. */
    public function lists()
    {
        return $this->hasMany(TaskList::class)->orderBy('position');
    }

    protected $casts = [
        'created_at' => 'datetime:Y-m-d H:i',
        'updated_at' => 'datetime:Y-m-d H:i',
    ];

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
    public function users()
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    /** Lời mời gửi tới email chưa có tài khoản, chưa được nhận. */
    public function pendingInvitations()
    {
        return $this->hasMany(ProjectInvitation::class)->whereNull('accepted_at')->latest();
    }

    public function scopeWithOwner($query)
    {
        return $query->with('owner');
    }
    public function scopeWithTasks($query)
    {
        return $query->with('tasks');
    }
    public function scopeWithUsers($query)
    {
        return $query->with('users');
    }
    public function scopeWithOwnerAndTasks($query)
    {
        return $query->with(['owner', 'tasks']);
    }
    public function scopeWithOwnerAndUsers($query)
    {
        return $query->with(['owner', 'users']);
    }
    public function scopeWithOwnerTasksAndUsers($query)
    {
        return $query->with(['owner', 'tasks', 'users']);
    }
    public function scopeLatestFirst($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
    public function scopeForUser($query, $userId)
    {
        return $query->where('owner_id', $userId);
    }
    public function scopeForUserWithTasks($query, $userId)
    {
        return $query->where('owner_id', $userId)->with('tasks');
    }
    public function scopeForUserWithTasksAndUsers($query, $userId)
    {
        return $query->where('owner_id', $userId)->with(['tasks', 'users']);
    }
    public function scopeForUserWithOwner($query, $userId)
    {
        return $query->where('owner_id', $userId)->with('owner');
    }
    public function scopeForUserWithOwnerAndTasks($query, $userId)
    {
        return $query->where('owner_id', $userId)->with(['owner', 'tasks']);
    }
    public function scopeForUserWithOwnerAndUsers($query, $userId)
    {
        return $query->where('owner_id', $userId)->with(['owner', 'users']);
    }
    public function scopeForUserWithOwnerTasksAndUsers($query, $userId)
    {
        return $query->where('owner_id', $userId)->with(['owner', 'tasks', 'users']);
    }
    public function scopeForUserWithOwnerTasksAndUsersLatestFirst($query, $userId)
    {
        return $query->where('owner_id', $userId)
                     ->with(['owner', 'tasks', 'users'])
                     ->orderBy('created_at', 'desc');
    }           
    public function scopeForUserWithOwnerTasksAndUsersCount($query, $userId)
    {
        return $query->where('owner_id', $userId)
                     ->with(['owner', 'tasks', 'users'])
                     ->count();
    }
    public function scopeForUserWithOwnerTasksAndUsersLatestFirstCount($query, $userId)
    {
        return $query->where('owner_id', $userId)
                     ->with(['owner', 'tasks', 'users'])
                     ->orderBy('created_at', 'desc')
                     ->count();
    }
    public function scopeWithTasksAndUsers($query)
    {
        return $query->with(['tasks', 'users']);
    }
}

