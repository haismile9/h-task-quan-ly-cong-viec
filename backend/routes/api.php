<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\Auth\RegistrationController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\ListController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\BackgroundController;


// 🟢 Public routes (không cần đăng nhập)
Route::get('/sanctum/csrf-cookie', fn () => response()->json(['csrf' => true]));
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// 🆕 Đăng ký từng bước: email → mã → họ tên + mật khẩu (web và mobile)
Route::middleware('throttle:signup')->group(function () {
    Route::post('/register/start', [RegistrationController::class, 'start']);
    Route::post('/register/verify-code', [RegistrationController::class, 'verifyCode']);
    Route::post('/register/complete', [RegistrationController::class, 'complete']);
});

// 📤 Gửi và xác minh mã email (public - trước khi có token)
Route::post('/verify-email', [VerifyEmailController::class, 'verify']);
Route::post('/resend-code', [VerifyEmailController::class, 'resend']);

// ✉️ Xem lời mời vào dự án (public - người được mời có thể chưa có tài khoản)
Route::get('/invitations/{token}', [InvitationController::class, 'show']);
Route::middleware('throttle:invitation')->group(function () {
    Route::post('/invitations/{token}/send-code', [InvitationController::class, 'sendCode']);
    Route::post('/invitations/{token}/verify-code', [InvitationController::class, 'verifyCode']);
    Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept']);
});

// 🔐 Password reset routes (public)
Route::post('/password/reset/send-code', [AuthController::class, 'sendPasswordResetCode']);
Route::post('/password/reset/verify-code', [AuthController::class, 'verifyPasswordResetCode']);
Route::post('/password/reset', [AuthController::class, 'resetPassword']);

// 🟡 Routes yêu cầu đăng nhập
Route::middleware('auth:sanctum')->group(function () {
    // 🔐 Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // 📦 Project
    Route::apiResource('projects', ProjectController::class);
    Route::post('/projects/{id}/members', [ProjectController::class, 'addMember']);
    Route::delete('/projects/{id}/members/{userId}', [ProjectController::class, 'removeMember']);
    Route::get('/projects/{id}/members', [ProjectController::class, 'getMembers']);
    Route::delete('/projects/{id}/invitations/{invitationId}', [ProjectController::class, 'cancelInvitation']);

    // 📦 Task
    Route::get('/projects/{projectId}/tasks', [TaskController::class, 'index']);
    Route::post('/projects/{projectId}/tasks', [TaskController::class, 'store']);
    Route::get('/tasks/{id}', [TaskController::class, 'show']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::put('/tasks/{id}/move', [TaskController::class, 'move']);

    // 🗂 Danh sách (cột) trên bảng
    Route::get('/projects/{projectId}/lists', [ListController::class, 'index']);
    Route::post('/projects/{projectId}/lists', [ListController::class, 'store']);
    Route::put('/projects/{projectId}/lists/reorder', [ListController::class, 'reorder']);
    Route::put('/lists/{id}', [ListController::class, 'update']);
    Route::delete('/lists/{id}', [ListController::class, 'destroy']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);
    Route::get('/my-tasks', [TaskController::class, 'myTasks']);
    
    // 📱 Mobile API endpoints
    Route::get('/mobile/today-tasks', [TaskController::class, 'todayTasks']);
    Route::get('/mobile/task-statistics', [TaskController::class, 'statistics']);
    Route::put('/mobile/tasks/{id}/status', [TaskController::class, 'updateStatus']);

    // 📅 Meeting routes
    Route::apiResource('meetings', MeetingController::class);
    Route::get('/mobile/today-meetings', [MeetingController::class, 'todayMeetings']);
    Route::get('/mobile/meeting-statistics', [MeetingController::class, 'statistics']);
    Route::put('/mobile/meetings/{id}/status', [MeetingController::class, 'updateStatus']);

    // 📦 Comment
    Route::get('/tasks/{taskId}/comments', [CommentController::class, 'index']);
    Route::post('/tasks/{taskId}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);

    // 📊 Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/tasks', [TaskController::class, 'dashboard']);

    // 🧠 Roles
    Route::middleware('role:admin')->get('/admin-only', fn () => 'Chào admin!');
    Route::middleware('role:admin,leader')->get('/manage-projects', fn () => 'Chào quản lý!');
    // Route::middleware('role:member')->get('/my-tasks', fn () => 'Chào thành viên!');

    // 👤 User profile
    Route::get('/user', fn (Request $request) => $request->user());
    Route::get('/account', fn (Request $req) => $req->user());
    Route::put('/account', [AuthController::class, 'updateProfile']);
    Route::put('/account/password', [AuthController::class, 'changePassword']);
    Route::put('/account/settings', [AuthController::class, 'updateSettings']);

    // 🖼 Ảnh nền bảng do người dùng tải lên (ảnh Unsplash có sẵn nằm ở FE)
    Route::get('/backgrounds', [BackgroundController::class, 'index']);
    Route::post('/backgrounds', [BackgroundController::class, 'store']);

    // 🕘 Nhật ký hoạt động
    Route::get('/activities/me', [ActivityController::class, 'mine']);
    Route::get('/tasks/{taskId}/activities', [ActivityController::class, 'forTask']);
    Route::get('/projects/{projectId}/activities', [ActivityController::class, 'forProject']);

    // 📊 Statistics
    Route::get('/projects/count', [ProjectController::class, 'count']);
    Route::get('/tasks/count', [TaskController::class, 'count']);
    Route::get('/comments/count', [CommentController::class, 'count']);

    // 🧾 Admin: thêm user
    Route::post('/users', [AuthController::class, 'store']);
    Route::get('/users/all', [AuthController::class, 'index']);

    // // 🔐 Kiểm tra email đã xác minh (tuỳ backend bạn dùng thêm logic bên trong)
    // Route::get('/verify-email/check', [AuthController::class, 'checkEmailVerified']);
});
