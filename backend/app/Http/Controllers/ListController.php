<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TaskList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Activity;

/** Danh sách (cột) trên bảng. Như Trello: mọi thành viên dự án đều quản lý được danh sách. */
class ListController extends Controller
{
    public function index($projectId)
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeMember($project);

        return response()->json($project->lists()->get());
    }

    public function store(Request $request, $projectId)
    {
        $data = $request->validate(['name' => 'required|string|max:100'], [
            'name.required' => 'Vui lòng nhập tên danh sách',
            'name.max' => 'Tên danh sách tối đa 100 ký tự',
        ]);
        $project = Project::findOrFail($projectId);
        $this->authorizeMember($project);

        $list = $project->lists()->create([
            'name' => trim($data['name']),
            'position' => (int) $project->lists()->max('position') + 1,
        ]);

        Activity::record('list_created', $project, null, ['list_name' => $list->name]);

        return response()->json($list, 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate(['name' => 'required|string|max:100'], [
            'name.required' => 'Vui lòng nhập tên danh sách',
        ]);
        $list = TaskList::with('project')->findOrFail($id);
        $this->authorizeMember($list->project);

        $oldName = $list->name;
        $list->update(['name' => trim($data['name'])]);
        if ($oldName !== $list->name) {
            Activity::record('list_renamed', $list->project, null, ['old_name' => $oldName, 'list_name' => $list->name]);
        }

        return response()->json($list->unsetRelation('project'));
    }

    /** Xoá danh sách cùng các thẻ trong đó. */
    public function destroy($id)
    {
        $list = TaskList::with('project')->findOrFail($id);
        $this->authorizeMember($list->project);

        if ($list->project->lists()->count() <= 1) {
            return response()->json(['message' => 'Bảng phải còn ít nhất một danh sách'], 422);
        }

        Activity::record('list_deleted', $list->project, null, [
            'list_name' => $list->name,
            'card_count' => $list->tasks()->count(),
        ]);
        $list->delete(); // thẻ bị xoá theo khoá ngoại cascade
        $this->renumber($list->project_id);

        return response()->json(['message' => 'Đã xoá danh sách']);
    }

    /** Sắp xếp lại các danh sách theo mảng id gửi lên. */
    public function reorder(Request $request, $projectId)
    {
        $data = $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $project = Project::findOrFail($projectId);
        $this->authorizeMember($project);

        $existing = $project->lists()->pluck('id')->all();
        if (count($data['ids']) !== count($existing) || array_diff($existing, $data['ids'])) {
            return response()->json(['message' => 'Danh sách gửi lên không khớp với bảng'], 422);
        }

        DB::transaction(function () use ($data) {
            foreach ($data['ids'] as $position => $id) {
                TaskList::whereKey($id)->update(['position' => $position]);
            }
        });

        return response()->json($project->lists()->get());
    }

    private function renumber(int $projectId): void
    {
        TaskList::where('project_id', $projectId)->orderBy('position')->get()
            ->each(fn (TaskList $l, int $i) => $l->position !== $i && $l->update(['position' => $i]));
    }

    private function authorizeMember(Project $project): void
    {
        $user = Auth::user();
        $isMember = $project->owner_id === $user->id
            || $user->role === 'admin'
            || $project->users()->where('user_id', $user->id)->exists();

        abort_unless($isMember, 403, 'Bạn không thuộc dự án này');
    }
}
