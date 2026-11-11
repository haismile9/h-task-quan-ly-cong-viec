<?php

namespace App\Http\Controllers;

use App\Models\EmailVerification;
use App\Models\ProjectInvitation;
use App\Models\User;
use App\Notifications\SendEmailVerificationCode;
use Illuminate\Http\Request;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Luồng nhận lời mời cho người chưa có tài khoản (không cần đăng nhập):
 *   1. GET  /invitations/{token}              → xem lời mời
 *   2. POST /invitations/{token}/send-code    → gửi mã 6 số tới email được mời
 *   3. POST /invitations/{token}/verify-code  → kiểm tra mã (chưa tiêu thụ)
 *   4. POST /invitations/{token}/accept       → mã + họ tên + mật khẩu → tạo tài khoản, vào dự án
 */
class InvitationController extends Controller
{
    private const CODE_TYPE = 'invitation';

    public function show(string $token)
    {
        $invitation = $this->findInvitation($token);
        if (!$invitation) {
            return $this->notFound();
        }

        return response()->json([
            'email' => $invitation->email,
            'accepted' => $invitation->accepted_at !== null,
            'has_account' => User::where('email', $invitation->email)->exists(),
            'project' => [
                'id' => $invitation->project->id,
                'name' => $invitation->project->name,
                'background_url' => $invitation->project->background_url,
            ],
            'inviter_name' => $invitation->inviter?->name,
        ]);
    }

    public function sendCode(string $token)
    {
        $invitation = $this->findInvitation($token);
        if (!$invitation) {
            return $this->notFound();
        }
        if ($error = $this->ensureCanSignUp($invitation)) {
            return $error;
        }

        $code = (string) random_int(100000, 999999);
        EmailVerification::where('email', $invitation->email)->where('type', self::CODE_TYPE)->delete();
        EmailVerification::create([
            'email' => $invitation->email,
            'code' => $code,
            'type' => self::CODE_TYPE,
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            (new AnonymousNotifiable)->route('mail', $invitation->email)
                ->notify(new SendEmailVerificationCode($code));
        } catch (\Throwable $e) {
            Log::warning('Không gửi được mã xác minh lời mời', ['email' => $invitation->email, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Không gửi được email, vui lòng thử lại sau'], 503);
        }

        return response()->json(['message' => 'Đã gửi mã xác minh']);
    }

    public function verifyCode(Request $request, string $token)
    {
        $request->validate(['code' => 'required|digits:6'], ['code.digits' => 'Mã xác minh gồm 6 chữ số']);

        $invitation = $this->findInvitation($token);
        if (!$invitation) {
            return $this->notFound();
        }
        if (!$this->validCode($invitation->email, $request->code)) {
            return response()->json(['message' => 'Mã xác minh không đúng hoặc đã hết hạn'], 422);
        }

        return response()->json(['message' => 'Email đã được xác minh']);
    }

    public function accept(Request $request, string $token)
    {
        $request->validate([
            'code' => 'required|digits:6',
            'name' => 'required|string|max:100',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'name.required' => 'Vui lòng nhập họ tên',
            'password.required' => 'Vui lòng tạo mật khẩu',
            'password.min' => 'Mật khẩu phải gồm ít nhất 8 ký tự',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp',
        ]);

        $invitation = $this->findInvitation($token);
        if (!$invitation) {
            return $this->notFound();
        }
        if ($error = $this->ensureCanSignUp($invitation)) {
            return $error;
        }
        $record = $this->validCode($invitation->email, $request->code);
        if (!$record) {
            return response()->json(['message' => 'Mã xác minh không đúng hoặc đã hết hạn'], 422);
        }

        $user = DB::transaction(function () use ($invitation, $request, $record) {
            $user = User::create([
                'name' => trim($request->name),
                'email' => $invitation->email,
                'password' => $request->password, // cast "hashed" tự mã hoá
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();
            $record->delete();
            // Nhận lời mời này và mọi lời mời khác đang chờ cho cùng email
            ProjectInvitation::acceptPendingFor($user);

            return $user;
        });

        return response()->json([
            'message' => 'Tạo tài khoản thành công',
            'token' => $user->createToken('api-token')->plainTextToken,
            'user' => $user,
            'project_id' => $invitation->project_id,
        ], 201);
    }

    private function findInvitation(string $token): ?ProjectInvitation
    {
        $invitation = ProjectInvitation::with(['project:id,name,background_url', 'inviter:id,name'])
            ->where('token', $token)
            ->first();

        return $invitation && $invitation->project ? $invitation : null;
    }

    /** Lời mời đã dùng hoặc email đã có tài khoản thì phải đăng nhập thay vì đăng ký. */
    private function ensureCanSignUp(ProjectInvitation $invitation)
    {
        if ($invitation->accepted_at || User::where('email', $invitation->email)->exists()) {
            return response()->json(['message' => 'Email này đã có tài khoản, vui lòng đăng nhập'], 409);
        }
        return null;
    }

    private function validCode(string $email, string $code): ?EmailVerification
    {
        return EmailVerification::where('email', $email)
            ->where('type', self::CODE_TYPE)
            ->where('code', $code)
            ->where('expires_at', '>', now())
            ->first();
    }

    private function notFound()
    {
        return response()->json(['message' => 'Lời mời không tồn tại hoặc đã bị huỷ'], 404);
    }
}
