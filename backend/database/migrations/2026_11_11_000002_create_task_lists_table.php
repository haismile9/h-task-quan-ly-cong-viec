<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Danh sách (cột) tuỳ chỉnh như Trello.
 * - task_lists: các cột của một dự án, có thứ tự.
 * - tasks.list_id + tasks.position: thẻ thuộc cột nào, ở vị trí nào.
 * Dữ liệu cũ: mỗi dự án có 3 danh sách theo trạng thái cũ, thẻ được xếp vào đúng danh sách.
 */
return new class extends Migration
{
    private const LEGACY_LISTS = ['pending' => 'Chờ làm', 'in_progress' => 'Đang làm', 'done' => 'Hoàn thành'];

    public function up(): void
    {
        Schema::create('task_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['project_id', 'position']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('list_id')->nullable()->after('project_id')->constrained('task_lists')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0)->after('list_id');
            $table->index(['list_id', 'position']);
        });

        // Chuyển dữ liệu cũ: trạng thái → danh sách
        $now = now();
        foreach (DB::table('projects')->pluck('id') as $projectId) {
            $listIds = [];
            $i = 0;
            foreach (self::LEGACY_LISTS as $status => $name) {
                $listIds[$status] = DB::table('task_lists')->insertGetId([
                    'project_id' => $projectId,
                    'name' => $name,
                    'position' => $i++,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $positions = [];
            $tasks = DB::table('tasks')->where('project_id', $projectId)->orderBy('id')->get(['id', 'status']);
            foreach ($tasks as $task) {
                $listId = $listIds[$task->status] ?? $listIds['pending'];
                $positions[$listId] = ($positions[$listId] ?? -1) + 1;
                DB::table('tasks')->where('id', $task->id)->update([
                    'list_id' => $listId,
                    'position' => $positions[$listId],
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['list_id']);
            $table->dropIndex(['list_id', 'position']);
            $table->dropColumn(['list_id', 'position']);
        });
        Schema::dropIfExists('task_lists');
    }
};
