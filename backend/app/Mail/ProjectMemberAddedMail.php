<?php

namespace App\Mail;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/** Báo cho người đã có tài khoản rằng họ vừa được thêm vào một dự án. */
class ProjectMemberAddedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Project $project, public User $member, public User $addedBy)
    {
    }

    public function build()
    {
        return $this->subject("{$this->addedBy->name} đã thêm bạn vào dự án {$this->project->name}")
            ->view('emails.project_member_added', [
                'memberName' => $this->member->name,
                'adderName' => $this->addedBy->name,
                'adderEmail' => $this->addedBy->email,
                'projectName' => $this->project->name,
                'projectDescription' => $this->project->description,
                'projectUrl' => rtrim(config('app.frontend_url'), '/') . '/projects/' . $this->project->id,
            ]);
    }
}
