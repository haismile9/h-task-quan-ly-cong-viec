<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\EmailVerification;

class VerifyEmailController extends Controller
{
    public function verify(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'code' => 'required|string',
    ]);

    $record = EmailVerification::where('email', $request->email)
        ->where('code', $request->code)
        ->where('type', 'email_verification') // không nhận mã đặt lại mật khẩu
        ->where('expires_at', '>', now())
        ->first();

    if (!$record) {
        return response()->json(['message' => 'Mã xác minh không đúng hoặc đã hết hạn'], 422);
    }

    if (User::where('email', $record->email)->exists()) {
        $record->delete();
        return response()->json(['message' => 'Email này đã được đăng ký, hãy đăng nhập'], 422);
    }

    // ✅ Tạo user từ thông tin đã lưu lúc đăng ký (mật khẩu đã được mã hoá sẵn)
    $user = User::create([
        'name' => $record->name,
        'email' => $record->email,
        'password' => $record->password,
    ]);
    $user->forceFill(['email_verified_at' => now()])->save();

    // Nhận các lời mời vào dự án đang chờ cho email này
    \App\Models\ProjectInvitation::acceptPendingFor($user);

    $token = $user->createToken('api-token')->plainTextToken;

    $record->delete();

    return response()->json([
        'message' => 'Xác minh thành công!',
        'token' => $token,
        'user' => $user,
    ]);
}


    public function resend(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Xoá mã cũ
        EmailVerification::where('email', $request->email)->delete();

        // Tạo mã mới
        $code = rand(100000, 999999);
        EmailVerification::create([
            'email' => $request->email,
            'code' => $code,
            'expires_at' => now()->addMinutes(10),
        ]);

        // Gửi mail
        $user = (object) ['email' => $request->email, 'name' => 'Người dùng'];
        $notifiable = new \Illuminate\Notifications\AnonymousNotifiable;
        $notifiable->route('mail', $request->email)
            ->notify(new \App\Notifications\SendEmailVerificationCode($code));

        return response()->json(['message' => 'Mã xác minh đã được gửi lại']);
    }
    public function __invoke(Request $request, $id, $hash)
{
    $user = \App\Models\User::findOrFail($id);

    if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        throw new \Illuminate\Auth\Access\AuthorizationException;
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new \Illuminate\Auth\Events\Verified($user));
    }

    return redirect('/?verified=1'); // hoặc bất kỳ route nào sau xác minh
}

}
