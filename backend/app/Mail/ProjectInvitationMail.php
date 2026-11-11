<?php

namespace App\Mail;

use App\Models\ProjectInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ProjectInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ProjectInvitation $invitation)
    {
    }

    public function build()
    {
        $inviter = $this->invitation->inviter->name;
        $project = $this->invitation->project->name;

        return $this->subject("{$inviter} đã mời bạn vào dự án {$project}")
            ->view('emails.project_invitation', [
                'inviterName' => $inviter,
                'inviterEmail' => $this->invitation->inviter->email,
                'projectName' => $project,
                'inviteUrl' => $this->invitation->url(),
            ]);
    }
}
