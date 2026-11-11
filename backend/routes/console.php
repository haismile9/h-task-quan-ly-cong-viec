<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Nhắc deadline qua email mỗi sáng 8h giờ Việt Nam
Schedule::command('check:task-deadlines')
    ->dailyAt('08:00')
    ->timezone('Asia/Ho_Chi_Minh')
    ->withoutOverlapping();
