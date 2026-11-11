<?php
//Controller/ProjectController.php
namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\ProjectInvitation;
use App\Mail\ProjectInvitationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Activity;

class ProjectController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
        return response()->json(Project::all());
    }


        // 🎯 Chỉ lấy những project mà user này tham gia hoặc sở hữu
        $projects = Project::where('owner_id', $user->id)
            ->orWhereHas('users', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'background_url' => 'nullable|string|max:500', // 🆕 validate ảnh nền
            'collaborator_email' => 'nullable|email|exists:users,email'
        ], [
            'name.required' => 'Tên dự án là bắt buộc',
            'name.max' => 'Tên dự án không được vượt quá 255 ký tự',
            'collaborator_email.email' => 'Email cộng tác không đúng định dạng',
            'collaborator_email.exists' => 'Email cộng tác chưa có tài khoản trong hệ thống',
        ]);

        DB::beginTransaction();

        try {
            $project = Project::create([
            'name' => $request->name,
            'description' => $request->description,
            'background_url' => $request->background_url, // ✅ Thêm dòng này
            'owner_id' => $user->id,
        ]);


            // 🛡️ Gán chủ sở hữu luôn là leader
            $project->users()->attach($user->id, ['role' => 'leader']);

            // Nếu có email cộng tác viên
            if ($request->collaborator_email) {
                $collaborator = User::where('email', $request->collaborator_email)->first();
                if ($collaborator) {
                    $project->users()->attach($collaborator->id, ['role' => 'member']);
                }
            }

            DB::commit();
            Activity::record('project_created', $project);
            return response()->json($project, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi khi tạo dự án'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $project = Project::with(['owner', 'users', 'pendingInvitations:id,project_id,email,created_at'])->find($id);

        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $user = auth()->user();
        
        // Check if user has access to this project (owner or member)
        $hasAccess = $project->owner_id == $user->id || 
                    $project->users->contains('id', $user->id);

        if (!$hasAccess) {
            // Return 404 instead of 403 to hide the existence of the project
            return response()->json(['error' => 'Project not found'], 404);
        }

        return response()->json($project);
    }


    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $user = Auth::user();

        // 🎯 Chỉ admin hoặc chủ sở hữu mới được sửa
        if ($user->id !== $project->owner_id && $user->role !== 'admin') {
            return response()->json(['message' => 'Không có quyền chỉnh sửa'], 403);
        }

        $project->update($request->only(['name', 'description', 'background_url']));


        return response()->json($project);
    }

   public function destroy(Project $project)
{
    $user = Auth::user();

    if ($user->id !== $project->owner_id && $user->role !== 'admin') {
        return response()->json(['message' => 'Không có quyền xóa'], 403);
    }

    $project->delete(); // ✅ Xoá thông thường (không cần forceDelete)

    return response()->json(['message' => 'Đã xoá dự án thành công'], 200);
}
    public function getMembers($id)
    {
        $project = Project::with('users')->findOrFail($id);

        return response()->json($project->users);
    }
    public function removeMember($id, $userId)
    {
        $project = Project::findOrFail($id);
        $currentUser = Auth::user();

        // 🔒 Chỉ chủ sở hữu mới có quyền xoá thành viên
        if ($currentUser->id !== $project->owner_id) {
            return response()->json(['message' => 'Bạn không có quyền xoá thành viên'], 403);
        }

        // Kiểm tra xem người dùng có phải là thành viên của dự án không
        if (!$project->users()->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'Người dùng không phải là thành viên của dự án'], 404);
        }

        $project->users()->detach($userId);

        return response()->json(['message' => 'Thành viên đã được xoá'], 200);
    }


    public function count()
    {
        return response()->json([
            'total' => Project::count()
        ]);
    }
    /**
     * Thêm thành viên theo email.
     * - Email đã có tài khoản → thêm ngay vào dự án.
     * - Email chưa có tài khoản → tạo lời mời đang chờ và gửi mail; người đó vào dự án
     *   ngay khi đăng ký bằng email này.
     */
    public function addMember(Request $request, $id)
    {
        $request->validate(['email' => 'required|email'], [
            'email.required' => 'Vui lòng nhập email',
            'email.email' => 'Email không đúng định dạng',
        ]);

        $project = Project::findOrFail($id);
        $currentUser = Auth::user();

        // 🔒 Chỉ chủ dự án hoặc admin được mời thành viên
        if ($currentUser->id !== $project->owner_id && $currentUser->role !== 'admin') {
            return response()->json(['message' => 'Chỉ chủ dự án mới được mời thành viên'], 403);
        }

        $email = strtolower(trim($request->email));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if ($user) {
            if ($user->id === $project->owner_id || $project->users()->where('user_id', $user->id)->exists()) {
                return response()->json(['message' => "{$user->name} đã là thành viên của dự án"], 422);
            }
            $project->users()->attach($user->id, ['role' => 'member']);
            Activity::record('member_added', $project, null, ['member_id' => $user->id, 'member_name' => $user->name]);

            return response()->json(['status' => 'added', 'message' => "Đã thêm {$user->name} vào dự án"]);
        }

        // Chưa có tài khoản → lời mời đang chờ (gửi lại nếu đã mời trước đó)
        $invitation = ProjectInvitation::firstOrNew(['project_id' => $project->id, 'email' => $email]);
        if (!$invitation->exists || $invitation->accepted_at) {
            $invitation->token = Str::random(48);
            $invitation->accepted_at = null;
        }
        $invitation->invited_by = $currentUser->id;
        $invitation->save();

        Activity::record('member_invited', $project, null, ['email' => $email]);

        $mailSent = true;
        try {
            Mail::to($email)->send(new ProjectInvitationMail($invitation->load('project', 'inviter')));
        } catch (\Throwable $e) {
            $mailSent = false;
            Log::warning('Không gửi được mail mời dự án', ['email' => $email, 'error' => $e->getMessage()]);
        }

        return response()->json([
            'status' => 'invited',
            'mail_sent' => $mailSent,
            'invite_url' => $invitation->url(),
            'message' => $mailSent
                ? "Đã gửi lời mời tới {$email}"
                : "Đã tạo lời mời cho {$email} nhưng chưa gửi được email",
        ], 201);
    }

    /** Huỷ một lời mời đang chờ. */
    public function cancelInvitation($id, $invitationId)
    {
        $project = Project::findOrFail($id);
        $currentUser = Auth::user();

        if ($currentUser->id !== $project->owner_id && $currentUser->role !== 'admin') {
            return response()->json(['message' => 'Chỉ chủ dự án mới được huỷ lời mời'], 403);
        }

        $project->pendingInvitations()->whereKey($invitationId)->firstOrFail()->delete();

        return response()->json(['message' => 'Đã huỷ lời mời']);
    }
}
