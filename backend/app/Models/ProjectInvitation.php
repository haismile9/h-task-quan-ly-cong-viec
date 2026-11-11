<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ProjectInvitation extends Model
{
    protected $fillable = ['project_id', 'email', 'token', 'invited_by', 'accepted_at'];

    protected $hidden = ['token'];

    protected $casts = [
        'accepted_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function scopePending($query)
    {
        return $query->whereNull('accepted_at');
    }

    /** Đường dẫn trên frontend để người được mời mở lời mời. */
    public function url(): string
    {
        return rtrim(config('app.frontend_url'), '/') . '/invite/' . $this->token;
    }

    /**
     * Biến mọi lời mời đang chờ của email này thành thành viên dự án.
     * Gọi ngay sau khi tài khoản được tạo.
     */
    public static function acceptPendingFor(User $user): int
    {
        $invitations = static::pending()->where('email', $user->email)->get();

        DB::transaction(function () use ($invitations, $user) {
            foreach ($invitations as $invitation) {
                $invitation->project->users()->syncWithoutDetaching([
                    $user->id => ['role' => 'member'],
                ]);
                $invitation->update(['accepted_at' => now()]);
            }
        });

        return $invitations->count();
    }
}
