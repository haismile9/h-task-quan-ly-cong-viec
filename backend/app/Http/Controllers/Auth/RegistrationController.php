<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\EmailVerification;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\Task;
use App\Models\User;
use App\Notifications\SendEmailVerificationCode;
use Illuminate\Http\Request;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * Đăng ký theo từng bước (như Trello), dùng chung cho web và mobile:
 *   1. POST /register/start        {email}                         → gửi mã 6 số
 *   2. POST /register/verify-code  {email, code}                   → kiểm tra mã (chưa dùng mã)
 *   3. POST /register/complete     {email, code, name, password}   → tạo tài khoản + bảng mẫu, trả token
 *
 * Luồng cũ POST /register + /verify-email vẫn giữ nguyên để không làm vỡ client cũ.
 */
class RegistrationController extends Controller
{
    private const CODE_TYPE = 'signup';

    public function start(Request $request)
    {
        $data = $request->validate(
            ['email' => 'required|email|max:255'],
            ['email.required' => 'Vui lòng nhập email', 'email.email' => 'Email không đúng định dạng']
        );
        $email = mb_strtolower(trim($data['email']));

        if (User::where('email', $email)->exists()) {
            return response()->json(['message' => 'Email này đã có tài khoản, vui lòng đăng nhập'], 409);
        }

        EmailVerification::where('email', $email)->where('type', self::CODE_TYPE)->delete();
        $code = (string) random_int(100000, 999999);
        EmailVerification::create([
            'email' => $email,
            'code' => $code,
            'type' => self::CODE_TYPE,
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            (new AnonymousNotifiable)->route('mail', $email)->notify(new SendEmailVerificationCode($code));
        } catch (\Throwable $e) {
            Log::warning('Không gửi được mã đăng ký', ['email' => $email, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Không gửi được email, vui lòng thử lại sau'], 503);
        }

        return response()->json(['message' => 'Đã gửi mã xác minh tới ' . $email]);
    }

    public function verifyCode(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6',
        ], ['code.digits' => 'Mã xác minh gồm 6 chữ số']);

        if (!$this->validCode($data['email'], $data['code'])) {
            return response()->json(['message' => 'Mã xác minh không đúng hoặc đã hết hạn'], 422);
        }

        return response()->json(['message' => 'Email đã được xác minh']);
    }

    public function complete(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6',
            'name' => 'required|string|max:100',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'name.required' => 'Vui lòng nhập họ tên',
            'name.max' => 'Họ tên không được vượt quá 100 ký tự',
            'password.required' => 'Vui lòng tạo mật khẩu',
            'password.min' => 'Mật khẩu phải gồm ít nhất 8 ký tự',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp',
        ]);
        $email = mb_strtolower(trim($data['email']));

        $record = $this->validCode($email, $data['code']);
        if (!$record) {
            return response()->json(['message' => 'Mã xác minh không đúng hoặc đã hết hạn'], 422);
        }
        if (User::where('email', $email)->exists()) {
            $record->delete();
            return response()->json(['message' => 'Email này đã có tài khoản, vui lòng đăng nhập'], 409);
        }

        [$user, $project] = DB::transaction(function () use ($email, $data, $record) {
            $user = User::create([
                'name' => trim($data['name']),
                'email' => $email,
                'password' => Hash::make($data['password']),
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();
            $record->delete();

            // Ghi hoạt động dưới tên người dùng mới
            Auth::setUser($user);
            ProjectInvitation::acceptPendingFor($user);
            $project = $this->createSampleBoard($user);

            return [$user, $project];
        });

        return response()->json([
            'message' => 'Tạo tài khoản thành công',
            'token' => $user->createToken('api-token')->plainTextToken,
            'user' => $user,
            'project_id' => $project->id,
        ], 201);
    }

    private function validCode(string $email, string $code): ?EmailVerification
    {
        return EmailVerification::where('email', mb_strtolower(trim($email)))
            ->where('type', self::CODE_TYPE)
            ->where('code', $code)
            ->where('expires_at', '>', now())
            ->first();
    }

    /** "Bảng đầu tiên của tôi": 3 cột mặc định (tạo tự động ở Project::booted) + vài thẻ hướng dẫn. */
    private function createSampleBoard(User $user): Project
    {
        $project = Project::create([
            'name' => 'Bảng đầu tiên của tôi',
            'description' => 'Bảng mẫu giúp bạn làm quen với H-Task. Cứ thoải mái sửa hoặc xoá.',
            'background_url' => 'gradient:blue',
            'owner_id' => $user->id,
        ]);
        $project->users()->attach($user->id, ['role' => 'leader']);
        Activity::record('project_created', $project);

        $lists = $project->lists()->orderBy('position')->get()->values();
        $cards = [
            0 => [
                ['👋 Chào mừng bạn đến với H-Task!', 'Mỗi bảng gồm các danh sách (cột), mỗi việc là một thẻ.', 'high'],
                ['Bấm vào thẻ để xem chi tiết', 'Trong thẻ bạn có thể thêm mô tả, hạn chót, thành viên và bình luận.', 'medium'],
                ['Kéo thẻ sang cột khác khi bắt đầu làm', 'Trên điện thoại: nhấn giữ thẻ rồi kéo.', 'low'],
            ],
            1 => [
                ['Mời đồng đội qua nút "Chia sẻ"', 'Người chưa có tài khoản sẽ nhận email mời và vào thẳng bảng.', 'medium'],
            ],
            2 => [
                ['Tạo tài khoản H-Task', null, 'low', 'done'],
            ],
        ];
        foreach ($cards as $i => $items) {
            $list = $lists[$i] ?? null;
            if (!$list) {
                continue;
            }
            foreach ($items as $pos => $c) {
                Task::create([
                    'project_id' => $project->id,
                    'list_id' => $list->id,
                    'position' => $pos,
                    'title' => $c[0],
                    'description' => $c[1],
                    'priority' => $c[2],
                    'status' => $c[3] ?? 'pending',
                ]);
            }
        }

        return $project;
    }
}
