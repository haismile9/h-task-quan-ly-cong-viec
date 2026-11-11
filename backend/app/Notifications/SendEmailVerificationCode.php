<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class SendEmailVerificationCode extends Notification
{
    public $code;

    public function __construct($code)
    {
        $this->code = $code;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Mã xác minh email H-Task')
            ->view('emails.code', [
                'title' => 'Xác minh địa chỉ email',
                'intro' => 'Nhập mã dưới đây trên H-Task để xác minh email của bạn.',
                'code' => $this->code,
            ]);
    }
}
