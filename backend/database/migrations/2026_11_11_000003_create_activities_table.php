<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nhật ký hoạt động (như Trello): ai làm gì, trên thẻ/danh sách/bảng nào.
 * `data` lưu sẵn tên thẻ, danh sách, người liên quan… để vẫn hiển thị được khi chúng đã bị xoá.
 * Thêm cài đặt nhận email nhắc hạn chót cho người dùng.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('task_id')->nullable(); // không ràng buộc: giữ lịch sử khi thẻ bị xoá
            $table->string('type', 50);
            $table->json('data')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index(['task_id', 'created_at']);
            $table->index(['project_id', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('email_deadline_reminders')->default(true)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('email_deadline_reminders');
        });
        Schema::dropIfExists('activities');
    }
};
