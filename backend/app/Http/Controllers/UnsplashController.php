<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Trung gian tới Unsplash API để lấy ảnh nền bảng (giữ Access Key ở server).
 * Theo hướng dẫn API của Unsplash: dùng trực tiếp URL ảnh của họ (hotlink),
 * ghi tên tác giả, và gọi download_location khi người dùng chọn ảnh.
 */
class UnsplashController extends Controller
{
    private const API = 'https://api.unsplash.com';
    private const PER_PAGE = 18;

    /** Ảnh theo từ khoá (mặc định: phong cảnh làm hình nền). ?query=&page= */
    public function photos(Request $request)
    {
        $key = config('services.unsplash.access_key');
        if (!$key) {
            return response()->json([
                'message' => 'Chưa cấu hình Unsplash. Thêm UNSPLASH_ACCESS_KEY vào backend/.env.',
                'configured' => false,
            ], 503);
        }

        $query = trim((string) $request->query('query', '')) ?: 'wallpaper landscape';
        $page = max(1, min(50, $request->integer('page', 1)));

        $cacheKey = 'unsplash:' . md5(mb_strtolower($query)) . ":{$page}";
        try {
            $data = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($key, $query, $page) {
                $res = Http::withHeaders(['Authorization' => "Client-ID {$key}", 'Accept-Version' => 'v1'])
                    ->timeout(10)
                    ->get(self::API . '/search/photos', [
                        'query' => $query,
                        'page' => $page,
                        'per_page' => self::PER_PAGE,
                        'orientation' => 'landscape',
                        'content_filter' => 'high',
                    ])
                    ->throw()
                    ->json();

                $utm = 'utm_source=' . urlencode(config('services.unsplash.app_name')) . '&utm_medium=referral';

                return [
                    'total_pages' => $res['total_pages'] ?? 1,
                    'results' => collect($res['results'] ?? [])->map(fn ($p) => [
                        'id' => $p['id'],
                        'thumb' => $p['urls']['small'],
                        // Ảnh đủ nét cho nền toàn màn hình nhưng vẫn nhẹ
                        'full' => $p['urls']['raw'] . '&w=1920&q=80&fm=jpg&fit=max',
                        'color' => $p['color'] ?? null,
                        'alt' => $p['alt_description'] ?? null,
                        'author' => $p['user']['name'] ?? '',
                        'author_url' => ($p['user']['links']['html'] ?? 'https://unsplash.com') . "?{$utm}",
                        'download_location' => $p['links']['download_location'] ?? null,
                    ])->values()->all(),
                ];
            });
        } catch (\Throwable $e) {
            Log::warning('Unsplash lỗi', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Không tải được ảnh từ Unsplash, thử lại sau.'], 502);
        }

        return response()->json($data + ['page' => $page, 'configured' => true]);
    }

    /** Báo lượt tải khi người dùng chọn ảnh làm nền (bắt buộc theo hướng dẫn Unsplash). */
    public function trackDownload(Request $request)
    {
        $data = $request->validate(['download_location' => 'required|url']);
        $key = config('services.unsplash.access_key');

        // Chỉ chuyển tiếp tới đúng API của Unsplash
        if ($key && str_starts_with($data['download_location'], self::API . '/')) {
            try {
                Http::withHeaders(['Authorization' => "Client-ID {$key}"])->timeout(5)->get($data['download_location']);
            } catch (\Throwable $e) {
                Log::info('Unsplash download tracking lỗi', ['error' => $e->getMessage()]);
            }
        }

        return response()->json(['ok' => true]);
    }
}
