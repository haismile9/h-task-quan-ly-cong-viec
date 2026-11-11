<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Luồng nhận lời mời (không cần đăng nhập): giới hạn riêng cho từng bước của từng lời mời,
        // đủ rộng cho người dùng thật nhưng chặn spam gửi mail và đoán mã.
        RateLimiter::for('invitation', function (Request $request) {
            $key = $request->ip() . '|' . $request->route('token') . '|' . $request->path();
            return str_ends_with($request->path(), 'send-code')
                ? Limit::perMinute(3)->by($key)
                : Limit::perMinute(10)->by($key);
        });
    }
}
