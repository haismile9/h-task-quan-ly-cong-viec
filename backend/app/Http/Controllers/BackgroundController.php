<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

/**
 * Ảnh nền bảng do người dùng tải lên (thay cho kho ảnh Unsplash của Trello).
 * Lưu ở storage/app/public/backgrounds/{userId}, phục vụ qua /storage (php artisan storage:link).
 */
class BackgroundController extends Controller
{
    private const LIMIT = 12;

    private function dir(): string
    {
        return 'backgrounds/' . Auth::id();
    }

    /** Các ảnh nền bạn đã tải lên, mới nhất trước. */
    public function index()
    {
        $disk = Storage::disk('public');
        $files = collect($disk->files($this->dir()))
            ->sortByDesc(fn ($path) => $disk->lastModified($path))
            ->take(self::LIMIT)
            ->map(fn ($path) => $disk->url($path))
            ->values();

        return response()->json($files);
    }

    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ], [
            'image.required' => 'Vui lòng chọn ảnh',
            'image.image' => 'File phải là ảnh',
            'image.mimes' => 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP',
            'image.max' => 'Ảnh tối đa 5MB',
        ]);

        $path = $request->file('image')->store($this->dir(), 'public');

        return response()->json(['url' => Storage::disk('public')->url($path)], 201);
    }
}
