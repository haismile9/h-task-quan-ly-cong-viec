<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmailVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Notifications\SendEmailVerificationCode;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Debug: Log request data
        \Log::info('Register request data: ', $request->all());
        
        try {
            $request->validate([
                'name' => 'required|string|max:100',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|confirmed|min:6',
            ], [
                'name.required' => 'Họ tên là bắt buộc',
                'name.string' => 'Họ tên phải là chuỗi ký tự',
                'name.max' => 'Họ tên không được vượt quá 100 ký tự',
                'email.required' => 'Email là bắt buộc',
                'email.email' => 'Email không đúng định dạng',
                'email.unique' => 'Email này đã được đăng ký',
                'password.required' => 'Mật khẩu là bắt buộc',
                'password.confirmed' => 'Mật khẩu xác nhận không khớp',
                'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        }

        // 🔁 Xóa code cũ
        EmailVerification::where('email', $request->email)->delete();

        // 📦 Tạo mã xác minh
        $code = rand(100000, 999999);
        EmailVerification::create([
            'email' => $request->email,
            'name' => $request->name,
            'password' => Hash::make($request->password),
            'code' => $code,
            'type' => 'email_verification',
            'expires_at' => now()->addMinutes(10),
        ]);

        // 📤 Gửi mã qua email
        $notifiable = new \Illuminate\Notifications\AnonymousNotifiable;
        $notifiable->route('mail', $request->email)
            ->notify(new \App\Notifications\SendEmailVerificationCode($code));

        return response()->json(['message' => 'Mã xác minh đã được gửi']);
    }

    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ], [
                'email.required' => 'Email là bắt buộc',
                'email.email' => 'Email không đúng định dạng',
                'password.required' => 'Mật khẩu là bắt buộc',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email hoặc mật khẩu không chính xác'], 422);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function refreshToken(Request $request)
    {
        $user = $request->user();
        $newToken = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $newToken,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Đăng xuất thành công']);
    }

    /** Đổi mật khẩu: cần mật khẩu hiện tại. Đăng xuất các phiên khác để an toàn. */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại',
            'password.required' => 'Vui lòng nhập mật khẩu mới',
            'password.min' => 'Mật khẩu mới phải gồm ít nhất 8 ký tự',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp',
        ]);

        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Mật khẩu hiện tại không đúng',
                'errors' => ['current_password' => ['Mật khẩu hiện tại không đúng']],
            ], 422);
        }

        $user->update(['password' => $request->password]);
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Đã đổi mật khẩu']);
    }

    /**
     * Cài đặt email thông báo. Gửi một hoặc cả hai trường:
     * email_deadline_reminders (nhắc hạn chót), email_project_added (được thêm vào dự án).
     * Mã xác minh và lời mời khi chưa có tài khoản luôn được gửi, không tắt được.
     */
    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'email_deadline_reminders' => 'sometimes|boolean',
            'email_project_added' => 'sometimes|boolean',
        ]);
        if (!$data) {
            return response()->json(['message' => 'Không có cài đặt nào để lưu'], 422);
        }
        $user = $request->user();
        $user->forceFill($data)->save();

        return response()->json(['message' => 'Đã lưu cài đặt', 'user' => $user->fresh()]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100']);
        $user = $request->user();
        $user->update(['name' => $request->name]);

        return response()->json([
            'message' => 'Cập nhật tên thành công',
            'user' => $user
        ]);
    }

    public function sendVerificationCode(Request $request)
    {
        $request->validate(['email' => 'required|email|unique:users,email']);

        $code = rand(100000, 999999);
        EmailVerification::updateOrCreate(
            ['email' => $request->email],
            ['code' => $code, 'expires_at' => now()->addMinutes(10)]
        );

        $notifiable = new class($request->email) {
            public $email;
            public function __construct($email) { $this->email = $email; }
            public function routeNotificationForMail() { return $this->email; }
        };

        $notifiable->notify(new SendEmailVerificationCode($code));

        return response()->json(['message' => 'Đã gửi mã xác nhận đến email']);
    }

    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required',
        ]);

        $record = EmailVerification::where('email', $request->email)
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Mã không hợp lệ hoặc đã hết hạn'], 422);
        }

        return response()->json(['message' => 'Xác nhận thành công']);
    }

    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)
                    ->where('email_verification_code', strtoupper($request->code))
                    ->first();

        if (!$user) {
            return response()->json(['message' => 'Mã xác minh không hợp lệ'], 422);
        }

        if (!$user->email_verified_at) {
        return response()->json(['message' => 'Tài khoản chưa xác minh email'], 403);
        }
        // Cập nhật trạng thái xác minh email
        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email đã được xác minh trước đó'], 422);
        }

        $user->email_verified_at = now();
        $user->email_verification_code = null;
        $user->save();

        return response()->json(['message' => 'Xác minh email thành công']);
    }

    public function sendPasswordResetCode(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email|exists:users,email',
            ], [
                'email.required' => 'Email là bắt buộc',
                'email.email' => 'Email không đúng định dạng',
                'email.exists' => 'Email này không tồn tại trong hệ thống',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        }

        // 🔁 Xóa code reset cũ
        EmailVerification::where('email', $request->email)->delete();

        // 📦 Tạo mã reset mật khẩu
        $code = rand(100000, 999999);
        
        \Log::info('Creating password reset record:', [
            'email' => $request->email,
            'code' => $code,
            'expires_at' => now()->addMinutes(10)->toDateTimeString(),
            'type' => 'password_reset'
        ]);
        
        $record = EmailVerification::create([
            'email' => $request->email,
            'code' => $code,
            'expires_at' => now()->addMinutes(10),
            'type' => 'password_reset', // Phân biệt với đăng ký
        ]);
        
        \Log::info('Password reset record created:', $record->toArray());

        // 📤 Gửi mã qua email
        $notifiable = new \Illuminate\Notifications\AnonymousNotifiable;
        $notifiable->route('mail', $request->email)
            ->notify(new \App\Notifications\SendPasswordResetCode($code));

        return response()->json(['message' => 'Mã reset mật khẩu đã được gửi đến email của bạn']);
    }

    public function verifyPasswordResetCode(Request $request)
    {
        // Debug logging
        \Log::info('Password reset verify request:', [
            'email' => $request->email,
            'code' => $request->code,
            'code_type' => gettype($request->code),
            'code_length' => strlen($request->code ?? '')
        ]);
        
        try {
            $request->validate([
                'email' => 'required|email',
                'code' => 'required|string|min:6|max:6',
            ], [
                'email.required' => 'Email là bắt buộc',
                'email.email' => 'Email không đúng định dạng',
                'code.required' => 'Mã xác nhận là bắt buộc',
                'code.min' => 'Mã xác nhận phải có 6 ký tự',
                'code.max' => 'Mã xác nhận phải có 6 ký tự',
            ]);
        } catch (ValidationException $e) {
            \Log::error('Password reset verify validation error:', $e->errors());
            return response()->json([
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        }

        $record = EmailVerification::where('email', $request->email)
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->where('type', 'password_reset')
            ->first();

        // Debug more details
        \Log::info('Database query results:', [
            'record_found' => $record ? 'yes' : 'no',
            'record_data' => $record ? $record->toArray() : null
        ]);
        
        // Check if there's any record with this email
        $emailRecords = EmailVerification::where('email', $request->email)->get();
        \Log::info('All records for this email:', $emailRecords->toArray());
        
        // Check if there's any record with this code
        $codeRecords = EmailVerification::where('code', $request->code)->get();
        \Log::info('All records with this code:', $codeRecords->toArray());

        if (!$record) {
            // Kiểm tra xem có record nào với email này không
            $anyRecord = EmailVerification::where('email', $request->email)
                ->where('type', 'password_reset')
                ->first();
            
            \Log::info('Any password reset record for email:', $anyRecord ? $anyRecord->toArray() : ['record' => 'no record found']);
            
            return response()->json(['message' => 'Mã không hợp lệ hoặc đã hết hạn'], 422);
        }

        return response()->json(['message' => 'Mã xác nhận hợp lệ']);
    }

    public function resetPassword(Request $request)
    {
        // Debug logging
        \Log::info('Password reset request:', $request->all());
        
        try {
            $request->validate([
                'email' => 'required|email',
                'code' => 'required|string|min:6|max:6',
                'password' => 'required|confirmed|min:6',
            ], [
                'email.required' => 'Email là bắt buộc',
                'email.email' => 'Email không đúng định dạng',
                'code.required' => 'Mã xác nhận là bắt buộc',
                'code.min' => 'Mã xác nhận phải có 6 ký tự',
                'code.max' => 'Mã xác nhận phải có 6 ký tự',
                'password.required' => 'Mật khẩu mới là bắt buộc',
                'password.confirmed' => 'Mật khẩu xác nhận không khớp',
                'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự',
            ]);
        } catch (ValidationException $e) {
            \Log::error('Password reset validation error:', $e->errors());
            return response()->json([
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        }

        $record = EmailVerification::where('email', $request->email)
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->where('type', 'password_reset')
            ->first();

        \Log::info('Password reset record found:', $record ? $record->toArray() : ['record' => 'not found']);

        if (!$record) {
            return response()->json(['message' => 'Mã không hợp lệ hoặc đã hết hạn'], 422);
        }

        // Cập nhật mật khẩu
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            \Log::error('User not found for email:', ['email' => $request->email]);
            return response()->json(['message' => 'Người dùng không tồn tại'], 422);
        }
        
        $user->password = Hash::make($request->password);
        $user->save();

        \Log::info('Password reset successful for user:', ['user_id' => $user->id]);

        // Xóa record reset
        $record->delete();

        return response()->json(['message' => 'Đặt lại mật khẩu thành công']);
    }
}
